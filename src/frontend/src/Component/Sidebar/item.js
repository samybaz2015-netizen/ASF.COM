import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../../Context/SidebarContext";

function Item({
  icon,
  name,
  id,
  link,
  handleLogout,
  isSubMenu,
}) {
  const location = useLocation();
  const { open } = useSidebar();

  const isActive = location.pathname === link;

  return (
    <Link
      to={link}
      id={id}
      onClick={handleLogout}
      className={`
        group
        flex
        items-center
        w-full
        h-[38px]
        rounded-[9px]
        mb-1
        font-cairo
        text-[13px]
        no-underline
        transition-colors
        duration-200
        ease-out
        overflow-visible

        ${open ? "px-2.5" : "px-0 justify-center"}

        ${
          isActive
            ? "bg-white text-secondaryColor"
            : "text-white/90 hover:bg-white/[0.08] hover:text-white"
        }
      `}
    >
      {/* Icon */}
      <i
        className={`
          ${
            isSubMenu && isActive
              ? "fa-regular fa-circle-dot"
              : icon
          }

          text-[16px]
          w-[22px]
          min-w-[22px]
          text-center
          shrink-0

          ${open ? "ml-3" : ""}
        `}
      />

      {/* Text */}
      {open && (
        <span
          className="
            flex-1
            min-w-0
            whitespace-nowrap
            font-medium
            leading-none
          "
        >
          {name}
        </span>
      )}
    </Link>
  );
}

export default Item;