import { Link } from "react-router-dom";

const EXTERNAL = /^(https?:|tel:|mailto:|wa\.me|#)/i;

/**
 * The design components use plain anchors. `A` keeps that markup but routes
 * in-app paths through React Router, so navigation never reloads the page while
 * external links, phone links and mail links stay ordinary anchors.
 */
export default function A({ href, to, children, ...rest }) {
  const target = to ?? href ?? "/";
  const isExternal =
    typeof target !== "string" || EXTERNAL.test(target) || rest.target === "_blank";

  if (isExternal) {
    return (
      <a href={typeof target === "string" ? target : "#"} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={target} {...rest}>
      {children}
    </Link>
  );
}
