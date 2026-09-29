const LOGO =
  'https://obsessionmarketing.com/wp-content/uploads/2024/04/cropped-Obsession-Marketing-Logo-9.png'

type Props = {
  onSignOut: () => void
}

export function Header({ onSignOut }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="brand-lockup">
          <img src={LOGO} alt="Obsession Marketing" />
          <div>
            <div className="studio-title">Obsession Marketing</div>
            <small>Zion White Bison · Content calendar</small>
          </div>
        </div>
        <button className="btn btn-ghost" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  )
}
