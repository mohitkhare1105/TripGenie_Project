from typing import List, Optional
from pydantic import BaseModel, Field


class DestinationImage(BaseModel):
    id: str = Field(..., description="Unique image identifier")
    url: str = Field(..., description="High-resolution image URL")
    thumb_url: str = Field(..., description="Thumbnail/preview image URL")
    alt_description: Optional[str] = Field(default=None, description="Accessible image description")
    photographer_name: Optional[str] = Field(default=None, description="Credit for photographer")
    photographer_url: Optional[str] = Field(default=None, description="Photographer profile URL")
    unsplash_url: Optional[str] = Field(default=None, description="Original Unsplash photo page")


class DestinationImagesResponse(BaseModel):
    query: str = Field(..., description="Destination search query")
    images: List[DestinationImage] = Field(default_factory=list, description="Array of relevant images")
    primary_image: Optional[DestinationImage] = Field(default=None, description="Primary hero image")

