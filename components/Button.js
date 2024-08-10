import styles from './Button.module.css'

export default function Button({ isSelected, ...props }) {
  const buttonClass = isSelected ? `${styles.btn} ${styles.selected}` : styles.btn;
  return <button type="button" className={buttonClass} {...props} />
}
