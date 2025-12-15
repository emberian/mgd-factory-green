import { useState } from 'react';

interface TutorialProps {
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Green Factory!',
    content: 'Run a cozy cafe by building production lines to fulfill customer orders. Each level challenges you to serve drinks before customers lose patience!',
    icon: '🌿',
  },
  {
    title: 'Storage Nodes',
    content: 'Storage nodes hold ingredients and drinks. Create them from the Build menu to store tea leaves, coffee beans, and the drinks you produce.',
    icon: '⭕',
  },
  {
    title: 'Recipe Stations',
    content: 'Recipe stations transform ingredients into drinks. They consume inputs and produce outputs automatically when connected properly.',
    icon: '⬛',
  },
  {
    title: 'Connecting Nodes',
    content: 'Tap a storage node to select it, then use "Connect to" to link it to a recipe station. Connect inputs (ingredients) and outputs (drinks) to complete the production chain.',
    icon: '➡️',
  },
  {
    title: 'Loading Ingredients',
    content: 'Open Inventory to see your available ingredients. After building storage nodes, you can transfer ingredients from inventory into your factory.',
    icon: '📦',
  },
  {
    title: 'Fulfilling Orders',
    content: 'Customers arrive with orders shown at the top. Produce the right drinks and the order is fulfilled automatically. Watch the timer—orders expire!',
    icon: '⏰',
  },
  {
    title: 'Ready to Start!',
    content: 'Press Start to begin the simulation. Your factory will process ingredients and fulfill orders. Complete all orders to unlock the next level!',
    icon: '▶️',
  },
];

export function Tutorial({ onClose }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-forest-800 rounded-2xl w-full max-w-sm overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-4 pb-2">
          {TUTORIAL_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep ? 'bg-sage w-4' : 'bg-forest-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-4 text-center">
          <div className="text-4xl mb-3">{step.icon}</div>
          <h2 className="text-lg font-semibold text-cream mb-2">{step.title}</h2>
          <p className="text-sm text-cream/70 leading-relaxed">{step.content}</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 p-4 border-t border-forest-600">
          {!isFirstStep ? (
            <button
              onClick={handlePrev}
              className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-600 text-cream/80 rounded-lg font-medium"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-600 text-cream/60 rounded-lg font-medium"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 bg-sage hover:bg-sage-light text-forest-900 rounded-lg font-medium"
          >
            {isLastStep ? "Let's Go!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
