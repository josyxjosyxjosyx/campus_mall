import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ColorInputProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  { name: "Red", hex: "#EF4444" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Green", hex: "#22C55E" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Black", hex: "#1F2937" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Brown", hex: "#92400E" },
];

const ColorInput = ({ value, onChange, label = "Color" }: ColorInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleColorChange = (color: string) => {
    setInputValue(color);
    onChange(color);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
  };

  const getColorDisplay = () => {
    const preset = PRESET_COLORS.find(
      (c) => c.hex.toLowerCase() === inputValue.toLowerCase() || c.name.toLowerCase() === inputValue.toLowerCase()
    );
    return preset ? preset.hex : inputValue || "#E5E7EB";
  };

  return (
    <div className="relative w-full">
      <label className="block text-xs font-medium text-gray-700 mb-2">{label}</label>
      
      <div className="flex gap-2">
        {/* Color Picker Input */}
        <input
          type="color"
          value={getColorDisplay()}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer p-1"
          title="Click to open color picker"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder="Color name or hex code (e.g., Red, #FF0000)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preset Colors Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
          <p className="text-xs font-medium text-gray-600 mb-2">Common Colors:</p>
          <div className="grid grid-cols-6 gap-2 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => handleColorChange(color.name)}
                type="button"
                className="relative group"
                title={`${color.name} (${color.hex})`}
              >
                <div
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    inputValue.toLowerCase() === color.name.toLowerCase() ||
                    inputValue.toLowerCase() === color.hex.toLowerCase()
                      ? "border-black ring-2 ring-blue-500"
                      : "border-gray-200"
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
                <span className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap mt-1 pointer-events-none">
                  {color.name}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-2">
            <p className="text-xs font-medium text-gray-600 mb-2">Or enter custom:</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Hex code: #FF0000"
                defaultValue={inputValue}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val.match(/^#[0-9A-Fa-f]{6}$/)) {
                    handleColorChange(val);
                  }
                }}
                className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Close hint */}
          <p className="text-xs text-gray-500 mt-2">Click outside or select a color to close</p>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ColorInput;
