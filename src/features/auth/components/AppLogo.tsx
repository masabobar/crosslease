import { Link } from "react-router-dom"
import clLogo from "@/assets/cl-logo.png"
import { PATHS } from "@/router/paths"

export function AppLogo() {
  return (
    <Link to={PATHS.LOGIN} className="cursor-pointer">
      <img src={clLogo} alt="Crosslease" className="h-10 w-auto" />
    </Link>
  )
}
