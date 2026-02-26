import React, { useState, useEffect, useRef, useMemo } from 'react';

interface SyntheticEvent {
  target: {
    value: number;
  };
}

interface SliderProps {
  defaultValue?: number;
  label: string | React.ReactNode;
  max: number;
  min: number;
  onChange(event: React.ChangeEvent<HTMLInputElement> | SyntheticEvent): void;
  onDragStateChange?(state: boolean): void;
  step: number;
  value: number;
  className?: string;
  trackClassName?: string;
  disabled?: boolean;
}

const DOUBLE_CLICK_THRESHOLD_MS = 300;

const Slider = ({
  defaultValue = 0,
  label,
  max,
  min,
  onChange,
  onDragStateChange = () => {},
  step,
  value,
  className = '',
  trackClassName,
  disabled = false,
}: SliderProps) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [isDragging, setIsDragging] = useState(false);
  const animationFrameRef = useRef<number>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState<string>(String(value));
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpTime = useRef(0);

  const decimalPlaces = useMemo(() => {
    const stepStr = String(step);
    return stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
  }, [step])

  const triggerChange = (value: number) => {
    const syntheticEvent: SyntheticEvent = {
      target: { value: value }
    }
    onChange(syntheticEvent);
  };

  useEffect(() => {
    onDragStateChange(isDragging);
  }, [isDragging]);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [value, isEditing, decimalPlaces]);

  // Handle scroll
  useEffect(() => {
    const sliderElement = containerRef.current;
    if (!sliderElement) return;

    const handleWheel = (event: WheelEvent) => {
      if (disabled || !event.shiftKey) return;

      event.preventDefault();
      const direction = -Math.sign(event.deltaX);
      const newValue = value + direction * step * 5;
      const clampedValue = Math.max(min, Math.min(max, parseFloat(newValue.toFixed(decimalPlaces))));

      if (clampedValue !== value && !isNaN(clampedValue)) {
        triggerChange(clampedValue);
      }
    };

    sliderElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      sliderElement.removeEventListener('wheel', handleWheel);
    };
  }, [value, min, max, step, onChange, decimalPlaces]);

  // Handle dragging
  useEffect(() => {
    const handleDragEndGlobal = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointerup', handleDragEndGlobal);
    }

    return () => {
      window.removeEventListener('pointerup', handleDragEndGlobal);
    };
  }, [isDragging]);

  // Handle animation
  useEffect(() => {
    if (isDragging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const startValue = displayValue;
    const endValue = value;
    const duration = 300;
    let startTime: number | null = null;

    const easeInOut = (t: number) => t * t * (3 - 2 * t);

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = timestamp - startTime;
      const linearFraction = Math.min(progress / duration, 1);
      const easedFraction = easeInOut(linearFraction);
      const currentValue = startValue + (endValue - startValue) * easedFraction;
      setDisplayValue(currentValue);

      if (linearFraction < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, isDragging]);

  const handleReset = () => {
    triggerChange(defaultValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(Number(e.target.value));
    onChange(e);
  };

  const handleDragStart = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    if (Date.now() - lastUpTime.current < DOUBLE_CLICK_THRESHOLD_MS) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    lastUpTime.current = Date.now();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputCommit = () => {
    let newValue = parseFloat(inputValue);
    if (isNaN(newValue)) {
      newValue = value;
    } else {
      newValue = Math.max(min, Math.min(max, parseFloat(newValue.toFixed(decimalPlaces))));
    }

    triggerChange(newValue);
    setIsEditing(false);
    setInputValue(String(value));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputCommit();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setInputValue(String(value));
      setIsEditing(false);
      e.currentTarget.blur();
    }
  };

  const textLabel = typeof label === 'string';

  return (
    <div className={`mb-2 ${className} ${disabled ? 'opacity-50' : ''}`} ref={containerRef}>
      <div className="flex justify-between items-center mb-1">
        <button
          type="button"
          className={`grid group/label justify-items-start ${textLabel ? (disabled ? 'disabled:cursor-not-allowed' : 'cursor-pointer') : 'cursor-default'}`}
          aria-label={textLabel ? `Reset ${label}` : undefined}
          aria-hidden={!textLabel}
          disabled={disabled || !textLabel}
          onClick={handleReset}
          onDoubleClick={handleReset}
        >
          <span
            aria-hidden={true}
            className={`col-start-1 row-start-1 text-sm font-medium text-text-secondary select-none transition-opacity duration-200 ease-in-out opacity-100 ${disabled || !textLabel ? '' : 'group-hover/label:opacity-0'}`}
          >
            {label}
          </span>
          <span
            aria-hidden={true}
            className={`col-start-1 row-start-1 text-sm font-medium text-text-primary select-none transition-opacity duration-200 ease-in-out opacity-0 ${disabled || !textLabel? '' : 'group-hover/label:opacity-100'}`}
          >
            Reset
          </span>
        </button>
        <div className="w-12 text-right">
          <input
            className={`w-full text-sm text-text-primary border transition-all duration-200 disabled:cursor-not-allowed 
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none 
              ${isEditing
                ? 'text-center bg-card-active border-gray-500 rounded px-1 py-0 outline-none focus:ring-1 focus:ring-blue-500 '
                : 'text-right bg-transparent border-transparent select-none'
            }`}
            max={max}
            min={min}
            onBlur={handleInputCommit}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={() => !disabled && setIsEditing(true)}
            step={step}
            type="number"
            value={isEditing ? inputValue :decimalPlaces > 0 && value === 0 ? '0' : value.toFixed(decimalPlaces)}
            disabled={disabled}
            data-tooltip={disabled ? null : `Click to edit`}
          />
        </div>
      </div>

      <div className="relative w-full h-5">
        <div
          className={`absolute top-1/2 left-0 w-full h-1.5 -translate-y-1/4 rounded-full pointer-events-none ${
            trackClassName || 'bg-card-active'
          }`}
        />
        <input
          className={`absolute top-1/2 left-0 w-full h-1.5 appearance-none bg-transparent m-0 p-0 slider-input z-10 
            ${isDragging ? 'slider-thumb-active' : ''} 
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={{ margin: 0 }}
          max={String(max)}
          min={String(min)}
          onChange={handleChange}
          onDoubleClick={handleReset}
          onPointerDown={handleDragStart}
          onPointerUp={handleDragEnd}
          step={String(step)}
          type="range"
          value={isDragging ? value : displayValue}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default Slider;