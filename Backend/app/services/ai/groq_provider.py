import asyncio
import json
import logging
from typing import Optional

import groq
from groq import AsyncGroq
from pydantic import ValidationError

from app.config import settings
from app.core.exceptions import AppException
from app.core.logging import setup_logger
from app.schemas.itinerary import ItineraryRequest, ItineraryResponse
from app.services.ai.itinerary_provider import (
    ItineraryProvider,
    AiServiceError,
    AiServiceUnavailableError,
)
from app.services.ai.prompts import (
    build_itinerary_prompt,
    build_optimization_prompt,
)

logger = setup_logger("groq_provider")


class GroqItineraryProvider(ItineraryProvider):
    """
    Groq AI provider implementing structured itinerary generation and optimization
    using official Groq Python SDK and JSON mode.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
        client: Optional[AsyncGroq] = None,
    ):
        self.api_key = api_key if api_key is not None else settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        self.timeout = timeout if timeout is not None else settings.GROQ_TIMEOUT
        self.max_retries = max_retries if max_retries is not None else settings.GROQ_MAX_RETRIES
        self._client = client

    def _get_client(self) -> AsyncGroq:
        """
        Lazily returns or instantiates the AsyncGroq client.
        Raises AiServiceUnavailableError if no API key is configured.
        """
        if self._client is not None:
            return self._client

        if (
            not self.api_key
            or not self.api_key.strip()
            or "your_" in self.api_key
            or "placeholder" in self.api_key.lower()
        ):
            raise AiServiceUnavailableError(
                "Groq AI service is not configured. Please set the GROQ_API_KEY environment variable in your server configuration."
            )

        self._client = AsyncGroq(api_key=self.api_key, timeout=self.timeout)
        return self._client

    def _clean_json_text(self, text: str) -> str:
        """
        Strips surrounding whitespace or markdown fences if present.
        """
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return cleaned.strip()

    async def _call_groq_chat_completion(
        self,
        system_instruction: str,
        user_prompt: str,
    ) -> str:
        """
        Invokes Groq chat completion with JSON object response mode and bounded retries.
        """
        client = self._get_client()
        attempts = 0
        total_attempts = 1 + max(0, self.max_retries)

        last_exception = None

        while attempts < total_attempts:
            attempts += 1
            try:
                logger.info(
                    "Calling Groq LLM (model=%s, timeout=%.1fs, attempt=%d/%d)",
                    self.model,
                    self.timeout,
                    attempts,
                    total_attempts,
                )
                response = await client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.4,
                    max_tokens=4096,
                )

                if not response.choices or not response.choices[0].message.content:
                    raise AiServiceError(
                        "Groq returned an empty response.",
                        status_code=502,
                    )

                return response.choices[0].message.content

            except groq.AuthenticationError as err:
                logger.error("Groq authentication failed: %s", str(err))
                raise AiServiceError(
                    "Groq authentication failed. Please verify GROQ_API_KEY.",
                    status_code=502,
                ) from err

            except groq.RateLimitError as err:
                logger.warning("Groq rate limit encountered (attempt %d/%d): %s", attempts, total_attempts, str(err))
                last_exception = AiServiceError(
                    "Groq AI rate limit reached. Please try again shortly.",
                    status_code=429,
                )
                if attempts < total_attempts:
                    await asyncio.sleep(0.5)
                    continue
                raise last_exception from err

            except (groq.APITimeoutError, groq.APIConnectionError) as err:
                logger.warning("Groq timeout or connection error (attempt %d/%d): %s", attempts, total_attempts, str(err))
                last_exception = AiServiceError(
                    "Groq AI request timed out or network connection failed.",
                    status_code=504,
                )
                if attempts < total_attempts:
                    await asyncio.sleep(0.5)
                    continue
                raise last_exception from err

            except groq.APIStatusError as err:
                logger.error("Groq API status error: status=%d, message=%s", err.status_code, err.message)
                status_code = 429 if err.status_code == 429 else 502
                raise AiServiceError(
                    f"Groq API error ({err.status_code}): {err.message}",
                    status_code=status_code,
                ) from err

            except AppException:
                raise

            except Exception as err:
                logger.error("Unexpected error during Groq chat completion: %s", str(err))
                last_exception = AiServiceError(
                    f"Groq itinerary generation failed: {str(err)}",
                    status_code=502,
                )
                if attempts < total_attempts:
                    await asyncio.sleep(0.5)
                    continue
                raise last_exception from err

        if last_exception:
            raise last_exception
        raise AiServiceError("Groq service call failed after retries.", status_code=502)

    def _parse_and_validate(self, raw_json_text: str) -> ItineraryResponse:
        """
        Parses JSON text and validates against ItineraryResponse schema.
        """
        cleaned_text = self._clean_json_text(raw_json_text)
        try:
            parsed_data = json.loads(cleaned_text)
        except json.JSONDecodeError as err:
            logger.error("Failed to decode Groq JSON response: %s", str(err))
            raise AiServiceError(
                f"Groq returned malformed JSON response: {str(err)}",
                status_code=502,
            ) from err

        if not isinstance(parsed_data, dict):
            raise AiServiceError(
                "Groq JSON response must be an object at the top level.",
                status_code=502,
            )

        try:
            return ItineraryResponse.model_validate(parsed_data)
        except ValidationError as err:
            logger.error("Groq JSON response failed Pydantic schema validation: %s", str(err))
            raise AiServiceError(
                f"Groq response did not conform to itinerary schema: {err.errors()}",
                status_code=502,
            ) from err

    async def generate_itinerary(self, request: ItineraryRequest) -> ItineraryResponse:
        """
        Generates a structured itinerary via Groq chat completions using JSON mode.
        """
        system_instruction, user_prompt = build_itinerary_prompt(request)
        raw_response = await self._call_groq_chat_completion(
            system_instruction=system_instruction,
            user_prompt=user_prompt,
        )
        return self._parse_and_validate(raw_response)

    async def optimize_itinerary(
        self,
        prompt: str,
        system_instruction: str,
        duration_days: int,
        destination: str,
    ) -> ItineraryResponse:
        """
        Generates an optimized, lower-cost itinerary via Groq chat completions using JSON mode.
        """
        raw_response = await self._call_groq_chat_completion(
            system_instruction=system_instruction,
            user_prompt=prompt,
        )
        return self._parse_and_validate(raw_response)

