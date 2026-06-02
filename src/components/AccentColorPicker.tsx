import {
  POLL_ACCENT_COLOR_HEX,
  POLL_ACCENT_COLOR_LABEL,
  POLL_ACCENT_COLORS,
  type PollAccentColor,
} from "../types";

interface AccentColorPickerProps {
  value: PollAccentColor;
  onChange: (color: PollAccentColor) => void;
  /** Label rendered above the swatches; also used to label the radio group. */
  label?: string;
}

export function AccentColorPicker({
  value,
  onChange,
  label = "Accent color",
}: AccentColorPickerProps) {
  return (
    <fieldset className="field accent-picker">
      <legend className="field-label">{label}</legend>
      <div
        className="accent-swatches"
        role="radiogroup"
        aria-label={label}
      >
        {POLL_ACCENT_COLORS.map((color) => {
          const selected = color === value;
          const colorLabel = POLL_ACCENT_COLOR_LABEL[color];
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={colorLabel}
              title={colorLabel}
              className={`accent-swatch${selected ? " accent-swatch-selected" : ""}`}
              style={{ ["--swatch-color" as string]: POLL_ACCENT_COLOR_HEX[color] }}
              onClick={() => onChange(color)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
