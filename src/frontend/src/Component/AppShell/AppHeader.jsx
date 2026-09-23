import { UserMenu } from "./UserMenu";
import { NotificationMenu } from "./NotificationMenu";
import { QuickActions } from "./QuickActions";
import { GlobalSearch } from "./GlobalSearch";
import { LanguageSwitch } from "./LanguageSwitch";

/**
 * الشريط العلوي الموحّد — المستوى الأول.
 *
 * لا يكرّر القائمة الجانبية: هذه مسؤولة عن التنقل، وهذا عن المستخدم والتنبيهات
 * والبحث واللغة والإجراءات العامة (البند 13).
 */
export function AppHeader() {
  return (
    <header className="ah" role="banner">
      <div className="ah__start">
        <UserMenu />
        <span className="ah__divider" />
        <NotificationMenu />
        <QuickActions />
      </div>

      <div className="ah__center">
        <GlobalSearch />
      </div>

      <div className="ah__end">
        <LanguageSwitch />
      </div>
    </header>
  );
}
