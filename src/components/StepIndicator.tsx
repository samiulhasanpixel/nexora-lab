import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  variant?: 'customer' | 'seller';
}

const StepIndicator = ({ steps, currentStep, variant = 'customer' }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: index === currentStep ? 1.1 : 1,
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-display font-semibold transition-colors duration-300 ${
                index < currentStep
                  ? variant === 'seller' ? 'gradient-seller text-seller-foreground' : 'gradient-primary text-primary-foreground'
                  : index === currentStep
                  ? variant === 'seller' ? 'gradient-seller text-seller-foreground shadow-lg' : 'gradient-primary text-primary-foreground shadow-lg'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
            </motion.div>
            <span className={`text-xs mt-1 font-medium ${
              index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-12 h-0.5 mb-5 transition-colors duration-300 ${
              index < currentStep 
                ? variant === 'seller' ? 'bg-seller' : 'bg-primary' 
                : 'bg-border'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
