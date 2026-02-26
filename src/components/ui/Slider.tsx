import React, { useState, useEffect, useRef } from 'react';
import { GLOBAL_KEYS } from './AppProperties';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpTime = useRef(0);

  const getDecimalPlaces = (step: number) => {
    const stepStr = String(step);
    return stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
  };

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
    const sliderElement = containerRef.current;
    if (!sliderElement) return;

    const handleWheel = (event: WheelEvent) => {
      if (disabled || !event.shiftKey) return;

      event.preventDefault();
      const direction = -Math.sign(event.deltaY);
      const newValue = value + direction * step * 2;
      const roundedNewValue = parseFloat(newValue.toFixed(getDecimalPlaces(step)));

      const clampedValue = Math.max(min, Math.min(max, roundedNewValue));

      if (clampedValue !== value && !isNaN(clampedValue)) {
        triggerChange(clampedValue);
      }
    };

    sliderElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      sliderElement.removeEventListener('wheel', handleWheel);
    };
  }, [value, min, max, step, onChange]);

  useEffect(() => {
    const handleDragEndGlobal = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleDragEndGlobal);
      window.addEventListener('touchend', handleDragEndGlobal);
    }

    return () => {
      window.removeEventListener('mouseup', handleDragEndGlobal);
      window.removeEventListener('touchend', handleDragEndGlobal);
    };
  }, [isDragging]);

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

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleReset = () => {
    if (disabled) return;
    triggerChange(defaultValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(Number(e.target.value));
    onChange(e);
  };

  const handleDragStart = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    if (disabled) return;
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

  const handleValueClick = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputCommit = () => {
    let newValue = parseFloat(inputValue);
    if (isNaN(newValue)) {
      newValue = value;
    } else {
      newValue = Math.max(min, Math.min(max, newValue));
    }

    triggerChange(newValue);
    setIsEditing(false);
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

  const handleRangeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.currentTarget.blur();
      return;
    }

    if (GLOBAL_KEYS.includes(e.key)) {
      e.currentTarget.blur();
    }
  };

  const decimalPlaces = getDecimalPlaces(step);
  const numericValue = isNaN(Number(value)) ? 0 : Number(value);

  return (
    <div className={`mb-2 ${className} ${disabled ? 'opacity-50' : ''}`} ref={containerRef}>
      <div className="flex justify-between items-center mb-1">
        <button
          type="button"
          className="grid group/label justify-items-start disabled:cursor-not-allowed"
          aria-label={`Reset ${label}`}
          disabled={disabled}
          onClick={handleReset}
          onDoubleClick={handleReset}
        >
          <span
            aria-hidden={true}
            className={`col-start-1 row-start-1 text-sm font-medium text-text-secondary select-none transition-opacity duration-200 ease-in-out opacity-100 ${disabled ? '' : 'group-hover/label:opacity-0'}`}
          >
            {label}
          </span>
          <span
            aria-hidden={true}
            className={`col-start-1 row-start-1 text-sm font-medium text-text-primary select-none transition-opacity duration-200 ease-in-out opacity-0 ${disabled ? '' : 'group-hover/label:opacity-100'}`}
          >
            Reset
          </span>
        </button>
        <div className="w-12 text-right">
          {isEditing ? (
            <input
              className="w-full text-sm text-right bg-card-active border border-gray-500 rounded px-1 py-0 outline-none focus:ring-1 focus:ring-blue-500 text-text-primary disabled:cursor-not-allowed"
              max={max}
              min={min}
              onBlur={handleInputCommit}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              ref={inputRef}
              step={step}
              type="number"
              value={inputValue}
              disabled={disabled}
            />
          ) : (
            <span
              className={`text-sm text-text-primary w-full text-right select-none ${disabled ? 'cursor-not-allowed' : 'cursor-text'}`}
              onClick={handleValueClick}
              onDoubleClick={handleReset}
              data-tooltip={disabled ? null : `Click to edit`}
            >
              {decimalPlaces > 0 && numericValue === 0 ? '0' : numericValue.toFixed(decimalPlaces)}
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full h-5">
        <div
          className={`absolute top-1/2 left-0 w-full h-1.5 -translate-y-1/4 rounded-full pointer-events-none ${
            trackClassName || 'bg-card-active'
          }`}
        />
        <input
          className={`absolute top-1/2 left-0 w-full h-1.5 appearance-none bg-transparent m-0 p-0 slider-input z-10 ${isDragging ? 'slider-thumb-active' : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          style={{ margin: 0 }}
          max={String(max)}
          min={String(min)}
          onChange={handleChange}
          onDoubleClick={handleReset}
          onKeyDown={handleRangeKeyDown}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
          onTouchStart={handleDragStart}
          step={String(step)}
          type="range"
          value={displayValue}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default Slider;