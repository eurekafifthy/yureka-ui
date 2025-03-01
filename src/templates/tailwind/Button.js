import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "medium",
  className = "",
  disabled = false,
  loading = false,
  muted = false,
  icon = null,
  iconPosition = "left",
  onClick = undefined,
  ...props
}) => {
  const baseClasses =
    "inline-flex cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none";

  const variantClasses = {
    primary: "bg-[#191A1F] hover:bg-[#27282e] text-white hover:text-white",
    secondary: "bg-[#27282e] hover:bg-[#373840] text-white hover:text-white",
    outline:
      "bg-transparent border border-[#191A1F] hover:border-white/50 text-white/90 hover:text-white",
    danger: "bg-[#da4f4a] hover:bg-[#e0423d] text-white",
    success: "bg-[#15592a] hover:bg-[#0f8532] text-white",
  };

  const sizeClasses = {
    small: "py-1 px-3 text-xs",
    medium: "py-2 px-4 text-xs",
    large: "py-2 px-4 text-sm",
  };

  const iconOnlyClasses = {
    small: "p-1",
    medium: "p-2",
    large: "p-2",
  };

  const iconSizeClasses = {
    small: "w-3 h-3",
    medium: "w-4 h-4",
    large: "w-5 h-5",
  };

  const spinnerSizeClasses = {
    small: "w-3 h-3 translate-y-[2px]",
    medium: "w-4 h-4 translate-y-[2px]",
    large: "w-[18px] h-[18px] translate-y-[1px]",
  };

  const applyIconSize = (iconElement) => {
    if (!iconElement) return null;

    const sizeClass = iconSizeClasses[size] || iconSizeClasses.medium;
    return React.cloneElement(iconElement, {
      className: `${iconElement.props.className || ""} ${sizeClass}`.trim(),
    });
  };

  const variantDisabledClasses = {
    primary: disabled || loading ? "hover:bg-[#191A1F]" : "",
    secondary: disabled || loading ? "hover:bg-[#27282e]" : "",
    outline: disabled || loading ? "hover:border-[#191A1F]" : "",
    danger: disabled || loading ? "hover:bg-[#da4f4a]" : "",
    success: disabled || loading ? "hover:bg-[#15592a]" : "",
  };

  const disabledClasses =
    disabled || loading ? "opacity-80 cursor-not-allowed" : "";

  const mutedClasses = muted && !disabled ? "opacity-60 hover:opacity-80" : "";

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  const hasChildren = React.Children.count(children) > 0;
  const isIconOnly = !hasChildren && (icon || loading);

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    isIconOnly
      ? iconOnlyClasses[size] || iconOnlyClasses.medium
      : sizeClasses[size] || sizeClasses.medium,
    disabledClasses,
    variantDisabledClasses[variant] || "",
    mutedClasses,
    className,
  ].join(" ");

  const sizedIcon = icon ? applyIconSize(icon) : null;

  const spinnerSize = spinnerSizeClasses[size];

  return (
    <button
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className={
            hasChildren
              ? "mr-2 max-w-5 max-h-5"
              : "flex items-center justify-center"
          }
        >
          <span
            className={`inline-block ${spinnerSize} flex-none border border-white/30 border-t-white/80 rounded-full animate-spin`}
          ></span>
        </span>
      ) : sizedIcon && iconPosition === "left" ? (
        <span
          className={hasChildren ? "mr-2" : "flex items-center justify-center"}
        >
          {sizedIcon}
        </span>
      ) : null}

      {children}

      {sizedIcon && iconPosition === "right" && !loading ? (
        <span
          className={hasChildren ? "ml-2" : "flex items-center justify-center"}
        >
          {sizedIcon}
        </span>
      ) : null}
    </button>
  );
};

export default Button;
