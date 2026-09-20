import { useState } from "react";
import "./Dashboard.css";

export default function Dashboard() {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className="dashboard">
            <aside className={`drawer ${drawerOpen ? "drawer--open" : ""}`}>
                <div className="drawer__brand">SalePilot</div>

                <nav className="drawer__nav">
                    <a className="drawer__link drawer__link--active" href="#">
                        Dashboard
                    </a>
                    <a className="drawer__link" href="#">
                        Customers
                    </a>
                    <a className="drawer__link" href="#">
                        Sales
                    </a>
                    <a className="drawer__link" href="#">
                        Reports
                    </a>
                </nav>
            </aside>

            {drawerOpen && (
                <button
                    className="backdrop"
                    aria-label="Close menu"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            <main className="content">
                <header className="topbar">
                    <button
                        className="menuButton"
                        onClick={() => setDrawerOpen(!drawerOpen)}
                    >
                        ☰
                    </button>

                    <h1>Dashboard</h1>
                </header>

                <section className="panel">
                    <h2>Overview</h2>
                    <p>Your dashboard content goes here.</p>
                </section>
            </main>
        </div>
    );
}