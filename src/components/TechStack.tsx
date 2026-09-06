import { Icon } from "@once-ui-system/core";
import { home } from "@/resources";
import styles from "./TechStack.module.scss";

/**
 * Tira de tecnologías de la portada.
 *
 * Quien revisa un perfil busca el stack en los primeros segundos, y hasta ahora
 * estaba solo en /about. Es una lista informativa, no navegable.
 */
export function TechStack() {
  if (home.stack.length === 0) return null;

  return (
    <ul className={styles.list} aria-label="Tecnologías principales">
      {home.stack.map((tech) => (
        <li key={tech.name} className={styles.item}>
          <Icon name={tech.icon} size="xs" onBackground="brand-medium" />
          {tech.name}
        </li>
      ))}
    </ul>
  );
}

export default TechStack;
