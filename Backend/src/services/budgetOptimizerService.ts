import { ItineraryResponse } from '../schemas/itineraryResponse';
import {
  OptimizeBudgetRequest,
  OptimizeBudgetResponse,
} from '../schemas/budgetSchema';
import { budgetService, BudgetService } from './budgetService';
import { aiService, AiService } from './aiService';

/**
 * Builds system instruction and user prompt for budget optimization.
 */
export const buildOptimizationPrompt = (
  itinerary: ItineraryResponse,
  userBudget: number,
  currentTotal: number,
  excessAmount: number,
  travellers: number,
  travelStyle?: string,
  interests?: string[]
): { systemInstruction: string; userPrompt: string } => {
  const destination = itinerary.trip.destination;
  const durationDays = itinerary.trip.durationDays;

  const systemInstruction = `You are TripGenie AI's Smart Budget Optimizer.
Your goal is to propose practical, lower-cost alternative activities, dining, and transit options for an itinerary that currently exceeds the traveller's budget.

STRICT CONSTRAINTS & RULES:
1. Return ONLY valid JSON adhering strictly to the response schema. No markdown wrapping, no commentary.
2. PRESERVE CORE CONTEXT:
   - Destination: ${destination}
   - Duration: EXACTLY ${durationDays} days (numbered 1 through ${durationDays} in sequence).
   - Travellers: ${travellers}
   - Primary interests: ${interests?.join(', ') || 'maintain current themes'}.
   - Travel style: ${travelStyle || 'maintain current style'}.
3. BUDGET TARGET:
   - Current Estimated Cost: INR ${currentTotal}
   - Target User Budget: INR ${userBudget}
   - Target Reduction: At least INR ${excessAmount}
4. OPTIMIZATION STRATEGIES:
   - Swap costly private transport for public transit, metro, or scenic walking routes.
   - Recommend authentic local street food, dhabas, and budget-friendly cafes instead of fine dining.
   - Choose free or low-cost cultural spots, parks, and viewpoints over expensive commercial tourist attractions.
   - Document key adjustments and trade-offs in the "notes" array.
5. REALISM:
   - Do NOT fabricate live discounts or claim verified low rates.
   - All costs must remain non-negative realistic estimates in INR.`;

  const userPrompt = `The following ${durationDays}-day trip to ${destination} for ${travellers} travellers currently costs estimated INR ${currentTotal}, exceeding the budget of INR ${userBudget} by INR ${excessAmount}.

Current Itinerary:
${JSON.stringify(itinerary, null, 2)}

Please regenerate an optimized, lower-cost ${durationDays}-day itinerary adhering strictly to the schema that reduces total expenses toward the INR ${userBudget} target.`;

  return { systemInstruction, userPrompt };
};

/**
 * Service for optimizing itineraries to fit user budgets using Gemini.
 */
export class BudgetOptimizerService {
  constructor(
    private ai: AiService = aiService,
    private budget: BudgetService = budgetService
  ) {}

  /**
   * Proposes a lower-cost itinerary alternative and recalculates all budget figures.
   */
  public async optimizeBudget(
    request: OptimizeBudgetRequest
  ): Promise<OptimizeBudgetResponse> {
    // 1. Recalculate original budget deterministically on server (never trust client numbers)
    const originalBudget = this.budget.calculateBudget(
      request.itinerary,
      request.userBudget,
      request.travellers
    );

    const excessAmount = Math.max(
      0,
      originalBudget.estimatedTotal - request.userBudget
    );

    // If original itinerary is already within budget, return with no modifications
    if (originalBudget.status !== 'over_budget' || excessAmount <= 0) {
      return {
        originalBudget,
        optimizedItinerary: request.itinerary,
        optimizedBudget: originalBudget,
        savings: 0,
        achievedTarget: true,
        tradeOffs: [
          'Itinerary is already within the specified budget; no cost reduction necessary.',
        ],
      };
    }

    // 2. Build optimization prompt
    const prompt = buildOptimizationPrompt(
      request.itinerary,
      request.userBudget,
      originalBudget.estimatedTotal,
      excessAmount,
      request.travellers,
      request.travelStyle,
      request.interests
    );

    // 3. Ask Gemini for lower-cost alternatives
    const proposedItinerary = await this.ai.generateFromPrompt(
      prompt.userPrompt,
      prompt.systemInstruction,
      request.itinerary.trip.durationDays,
      request.itinerary.trip.destination
    );

    // 4. Recalculate revised budget deterministically in backend code
    const optimizedBudget = this.budget.calculateBudget(
      proposedItinerary,
      request.userBudget,
      request.travellers
    );

    // 5. Compute actual savings and target achievement
    const savings = Math.max(
      0,
      originalBudget.estimatedTotal - optimizedBudget.estimatedTotal
    );
    const achievedTarget = optimizedBudget.status !== 'over_budget';

    const tradeOffs =
      proposedItinerary.notes && proposedItinerary.notes.length > 0
        ? proposedItinerary.notes
        : [
            `Saved approximately INR ${savings.toLocaleString()} by selecting cost-effective local alternatives.`,
          ];

    return {
      originalBudget,
      optimizedItinerary: proposedItinerary,
      optimizedBudget,
      savings,
      achievedTarget,
      tradeOffs,
    };
  }
}

export const budgetOptimizerService = new BudgetOptimizerService();

