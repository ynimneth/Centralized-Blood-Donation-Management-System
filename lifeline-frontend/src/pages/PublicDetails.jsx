import { Link, useNavigate } from 'react-router-dom';
import heroImage from '../assets/loginpage.png';
import { publicNavItems } from './publicSections';
import './PublicDetails.css';

const infoSections = [
    {
        title: 'What Is LifeLine?',
        text: 'LifeLine is designed to connect willing blood donors with people and hospitals that need timely support. It gives visitors a clear path to learn, register, log in, and take part in donation activities.'
    },
    {
        title: 'Main Purpose',
        text: 'The main purpose of this website is to make blood donation easier, faster, and more organized. It helps people understand donation, respond to urgent needs, and support a safer blood supply for the community.'
    },
    {
        title: 'Why Blood Is Needed',
        text: 'Blood is needed for accidents, surgeries, cancer treatment, childbirth emergencies, anemia care, and many other medical situations. One donation can support multiple patients and make a lifesaving difference.'
    },
    {
        title: 'Who Can Donate',
        text: 'Healthy adults who meet age, weight, and basic health requirements are often eligible to donate. Final eligibility always depends on medical guidance and screening at the donation center.'
    }
];

const steps = [
    'Read the public information and understand the donation process.',
    'Register or log in to access donation-related features in LifeLine.',
    'Complete your profile and appointment or donor steps inside the system.',
    'Visit a blood donation center or approved camp and complete screening.',
    'Donate safely and continue helping patients in need.'
];

const hotlines = [
    { label: 'LifeLine Support', value: '+94 11 555 0101', href: 'tel:+94115550101' },
    { label: 'Emergency Blood Help', value: '+94 11 555 0202', href: 'tel:+94115550202' },
    { label: 'General Enquiries', value: '+94 11 555 0303', href: 'tel:+94115550303' }
];

const usefulLinks = [
    { label: 'LifeLine Information Portal', href: 'https://www.lifeline.org' },
    { label: 'World Health Organization Blood Safety', href: 'https://www.who.int/health-topics/blood-products-and-blood-transfusion' },
    { label: 'IFRC Blood Donation Information', href: 'https://www.ifrc.org' },
    { label: 'Facebook Community Updates', href: 'https://www.facebook.com' }
];

function PublicDetails() {
    const navigate = useNavigate();

    return (
        <div className="public-details-page">
            <header className="public-navbar">
                <div className="public-navbar-inner">
                    <div className="public-logo" onClick={() => navigate('/details')} role="button" tabIndex={0}>
                        <div className="public-logo-copy">
                            <strong>LifeLine</strong>
                            <span>Blood Donation & Management System</span>
                        </div>
                    </div>

                    <nav className="public-nav-links">
                        {publicNavItems.map((item) => (
                            <Link key={item.path} to={item.path} className="public-nav-item">
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="public-navbar-actions">
                        <Link to="/register" className="btn btn-primary public-primary-link">
                            Register
                        </Link>
                    </div>
                </div>
            </header>

            <main className="public-details-content">
                <section
                    className="public-hero-banner"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 248, 248, 0.28)), url(${heroImage})`
                    }}
                >
                    <div className="public-hero-overlay">
                        <div className="public-hero-panel">
                            <h1>Welcome To LifeLine</h1>
                            <h2>(Centralized Blood Donation & Management System)</h2>
                            <div className="public-hero-divider" />
                            <p>Sri Lanka</p>
                        </div>

                        <div className="public-hero-buttons">
                            <Link to="/register" className="public-cta-button">
                                Become a Donor
                            </Link>
                            <button type="button" className="public-ghost-button" onClick={() => navigate('/login')}>
                                Sign In
                            </button>
                        </div>
                    </div>
                </section>

                <section id="info" className="public-intro-strip">
                    <div>
                        <span className="public-section-tag">Public Access</span>
                        <h3>Understand the website before you join</h3>
                    </div>
                    <p>
                        LifeLine gives visitors a clear idea of why blood donation matters, how this service helps the
                        community, and how you can move from learning to registering and donating with confidence.
                    </p>
                </section>

                <section className="public-grid">
                    {infoSections.map((section) => (
                        <article key={section.title} className="public-card public-soft-card">
                            <h3>{section.title}</h3>
                            <p>{section.text}</p>
                        </article>
                    ))}
                </section>

                <section className="public-lower-grid">
                    <article className="public-card public-soft-card">
                        <h3>How To Donate Through This Website</h3>
                        <ol className="public-steps">
                            {steps.map((step) => (
                                <li key={step}>{step}</li>
                            ))}
                        </ol>
                    </article>

                    <article className="public-card public-feature-card">
                        <h3>Benefits Of Donation</h3>
                        <ul className="public-list">
                            <li>Supports patients during emergency and planned treatment.</li>
                            <li>Encourages a stronger community response to urgent blood needs.</li>
                            <li>Helps donors take part in a meaningful public health service.</li>
                            <li>Builds awareness around safe, regular, and responsible donation.</li>
                        </ul>
                    </article>
                </section>

                <section className="public-contact-grid">
                    <article className="public-card public-soft-card">
                        <h3>Contact Hotlines</h3>
                        <div className="public-contact-list">
                            {hotlines.map((hotline) => (
                                <a key={hotline.label} href={hotline.href} className="public-contact-item">
                                    <span>{hotline.label}</span>
                                    <strong>{hotline.value}</strong>
                                </a>
                            ))}
                        </div>
                    </article>

                    <article className="public-card public-soft-card">
                        <h3>Useful Links</h3>
                        <div className="public-link-list">
                            {usefulLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="public-resource-link"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </article>
                </section>
            </main>
        </div>
    );
}

export default PublicDetails;
