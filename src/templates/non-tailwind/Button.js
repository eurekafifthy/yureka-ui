import React, { Children, cloneElement } from "react";
import styles from "./Button.module.css";

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
  onClick,
  ...props
}) => {
  const sizeClassMap = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  const variantClassMap = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: styles.outline,
    danger: styles.danger,
    success: styles.success,
  };

  const hasChildren = Children.count(children) > 0;

  const isIconOnly = !hasChildren && (icon || loading);

  const iconOnlyClassMap = {
    small: styles.iconOnlySmall,
    medium: styles.iconOnlyMedium,
    large: styles.iconOnlyLarge,
  };

  const iconSizeClassMap = {
    small: styles.iconSmall,
    medium: styles.iconMedium,
    large: styles.iconLarge,
  };

  const spinnerSizeClassMap = {
    small: styles.spinnerSmall,
    medium: styles.spinnerMedium,
    large: styles.spinnerLarge,
  };

  const applyIconSize = (iconElement) => {
    if (!React.isValidElement(iconElement)) return null;

    const typedIcon = iconElement;

    const sizeClass = iconSizeClassMap[size] || iconSizeClassMap.medium;
    return cloneElement(typedIcon, {
      className: `${typedIcon.props.className || ""} ${sizeClass}`.trim(),
    });
  };

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  const buttonClasses = [
    styles.button,
    variantClassMap[variant] || variantClassMap.primary,
    isIconOnly
      ? iconOnlyClassMap[size] || iconOnlyClassMap.medium
      : sizeClassMap[size] || sizeClassMap.medium,
    muted && !disabled ? styles.muted : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const sizedIcon = icon ? applyIconSize(icon) : null;

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={hasChildren ? styles.iconLeft : ""}>
          <span
            className={`${styles.spinner} ${spinnerSizeClassMap[size]}`}
          ></span>
        </span>
      ) : sizedIcon && iconPosition === "left" ? (
        <span className={hasChildren ? styles.iconLeft : ""}>{sizedIcon}</span>
      ) : null}

      {children}

      {sizedIcon && iconPosition === "right" && !loading ? (
        <span className={hasChildren ? styles.iconRight : ""}>{sizedIcon}</span>
      ) : null}
    </button>
  );
};

export default Button;
