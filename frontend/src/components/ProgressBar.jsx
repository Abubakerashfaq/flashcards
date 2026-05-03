const ProgressBar = ({ bgcolor, completed }) => {

  // Derive a lighter, translucent version of the bgcolor for the track
  const getLighterColor = (color) => {
    if (!color) return 'rgba(255, 255, 255, 0.25)';

    // Handle hex colors (#RRGGBB or #RGB)
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.25)`;
    }

    // Handle rgb(...) colors
    if (color.startsWith('rgb(')) {
      const values = color.match(/\d+/g);
      if (values && values.length >= 3) {
        return `rgba(${values[0]}, ${values[1]}, ${values[2]}, 0.25)`;
      }
    }

    // Handle rgba(...) — swap the alpha
    if (color.startsWith('rgba(')) {
      return color.replace(/rgba\(([^)]+)\)/, (_, inner) => {
        const parts = inner.split(',').map(p => p.trim());
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 0.25)`;
      });
    }

    // Fallback for named colors or unknown formats
    return 'rgba(255, 255, 255, 0.25)';
  };

  const containerStyles = {
    height: 6,
    width: '100%',
    backgroundColor: getLighterColor(bgcolor),
    borderRadius: 50,
  };

  const fillerStyles = {
    height: '100%',
    width: `${completed}%`,
    backgroundColor: bgcolor,
    borderRadius: 'inherit',
  };

  return (
    <div style={containerStyles}>
      <div style={fillerStyles}></div>
    </div>
  );
};

export default ProgressBar;