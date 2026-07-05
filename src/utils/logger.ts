/**
 * Logging utilities with structured output
 */

export const log = (message: string) => {
  console.log(`ℹ️  ${message}`);
};

export const logSuccess = (message: string) => {
  console.log(`✅ ${message}`);
};

export const logWarning = (message: string) => {
  console.warn(`⚠️  ${message}`);
};

export const logError = (message: string) => {
  console.error(`❌ ${message}`);
};

export const logStep = (stepNumber: number, totalSteps: number, message: string) => {
  console.log(`[${stepNumber}/${totalSteps}] ${message}`);
};

export const logSeparator = () => {
  console.log('─'.repeat(80));
};
