import {
  ACCENT_COLORS,
  ACCENT_HEX,
  ACCENT_LABELS,
  DEFAULT_ACCENT_COLOR,
  type AccentColor,
} from "../accentColors";

type AccentColorPickerProps = {
  value: AccentColor;
  onChange: (color: AccentColor) => void;
};

export function AccentColorPicker({ value, onChange }: AccentColorPickerProps) {
  return (
    <fieldset className="accent-picker-fieldset">
      <legend className="field-label">Accent color</legend>
      <div
        className="accent-picker"
        role="radiogroup"
        aria-label="Poll accent color"
      >
        {ACCENT_COLORS.map((color) => {
          const selected = value === color;
          return (
            <label
              key={color}
              className={`accent-swatch${selected ? " accent-swatch-selected" : ""}`}
            >
              <input
                type="radio"
                name="accentColor"
                value={color}
                checked={selected}
                onChange={() => onChange(color)}
                className="accent-swatch-input"
              />
              <span
                className="accent-swatch-dot"
                style={{ backgroundColor: ACCENT_HEX[color] }}
                aria-hidden="true"
              />
              <span className="accent-swatch-label">{ACCENT_LABELS[color]}</span>
            </label>
          );
        })}
      </div>
      <p className="accent-picker-hint">
        Default is {ACCENT_LABELS[DEFAULT_ACCENT_COLOR]}. Used for bars, links,
        and buttons on your poll.
      </p>
    </fieldset>
  );
}
