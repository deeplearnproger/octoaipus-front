import { people01, people02, people03, facebook, instagram, linkedin, twitter, devart, binance, coinbase, dropbox, send, shield, star, airbnb, lifeacademy, program_ace, three_d_models} from "@/public/assets";

export const navLinks = [
    {
        id: "home",
        title: "Home",
    },
    {
        id: "features",
        title: "How it Works",
    },
    {
        id: "updates",
        title: "Updates",
    },
    {
        id: "clients",
        title: "Partners",
    },
];

export const features = [
    {
        id: "feature-1",
        icon: star,
        title: "Medical-Grade AI",
        content:
            "octoaipus is trained on over 1 million chest X-rays to deliver expert-level diagnostic insights.",
    },
    {
        id: "feature-2",
        icon: shield,
        title: "Privacy & Security",
        content:
            "We follow strict data protection standards. Your medical images are never stored or shared.",
    },
    {
        id: "feature-3",
        icon: send,
        title: "Instant & Free",
        content:
            "Upload a scan and receive your result in seconds — completely free, without login or waiting.",
    },
];

export const feedback = [
    {
        id: "feedback-1",
        content:
            "octoaipus helped me understand my chest X-ray in seconds. I didn't have to wait for a doctor — and the results were spot on.",
        name: "Alex Carter",
        title: "Patient from the UK",
        img: people02,
    },
    {
        id: "feedback-2",
        content:
            "As a physician, I use octoaipus as a second opinion tool. It's fast, reliable, and surprisingly accurate — a great assistant in diagnosis.",
        name: "Dr. Maya Lin",
        title: "Pulmonologist",
        img: people01,
    },
    {
        id: "feedback-3",
        content:
            "octoaipus trained on over a million X-rays to ensure safety and precision. It's AI, but with a human-first mindset.",
        name: "Ethan Volkov",
        title: "Lead AI Engineer",
        img: people03,
    },
];

export const stats = [
    {
        id: "stats-1",
        title: "Scans Analyzed",
        value: "1M+",
    },
    {
        id: "stats-2",
        title: "Global Users",
        value: "75K+",
    },
    {
        id: "stats-3",
        title: "Diagnosis Accuracy",
        value: "94.7%",
    },
];

export const footerLinks = [
    {
        id: "footerLinks-1",
        title: "Useful Links",
        links: [
            {
                name: "How it Works",
                link: "#features",
            },
            {
                name: "Features",
                link: "#features",
            },
            {
                name: "Updates",
                link: "#updates",
            },
            {
                name: "Privacy Policy",
                link: "/privacy",
            },
            {
                name: "Terms of Service",
                link: "/terms",
            },
            {
                name: "About Us",
                link: "/about",
            },
        ],
    },
    {
        id: "footerLinks-2",
        title: "Support",
        links: [
            {
                name: "Help Center",
                link: "mailto:tymarbeit@gmail.com?subject=Help%20Request%20-%20Pneumonia%20Detection%20App",
            },
            {
                name: "Contact Us",
                link: "mailto:tymarbeit@gmail.com?subject=Contact%20-%20Pneumonia%20Detection%20App",
            },
            {
                name: "Report Bug",
                link: "mailto:tymarbeit@gmail.com?subject=Bug%20Report%20-%20Pneumonia%20Detection%20App",
            },
            {
                name: "Feature Request",
                link: "mailto:tymarbeit@gmail.com?subject=Feature%20Request%20-%20Pneumonia%20Detection%20App",
            },
            {
                name: "Feedback",
                link: "mailto:tymarbeit@gmail.com?subject=Feedback%20-%20Pneumonia%20Detection%20App",
            },
        ],
    },
    {
        id: "footerLinks-3",
        title: "Partners",
        links: [
            {
                name: "Our Partners",
                link: "#clients",
            },
            {
                name: "Become a Partner",
                link: "mailto:tymarbeit@gmail.com?subject=Partnership%20Inquiry%20-%20Pneumonia%20Detection%20App",
            },
            {
                name: "API Access",
                link: "mailto:tymarbeit@gmail.com?subject=API%20Access%20Request%20-%20Pneumonia%20Detection%20App",
            },
            {
                name: "Integration",
                link: "mailto:tymarbeit@gmail.com?subject=Integration%20Request%20-%20Pneumonia%20Detection%20App",
            },
        ],
    },
];

export const socialMedia = [
    {
        id: "social-media-1",
        icon: instagram,
        link: "https://www.instagram.com/",
    },
    {
        id: "social-media-2",
        icon: facebook,
        link: "https://www.facebook.com/",
    },
    {
        id: "social-media-3",
        icon: twitter,
        link: "https://www.twitter.com/",
    },
    {
        id: "social-media-4",
        icon: linkedin,
        link: "https://www.linkedin.com/",
    },
];

export const clients = [
    {
        id: "client-1",
        logo: devart,
    },
    {
        id: "client-2",
        logo: lifeacademy,
    },
    {
        id: "client-3",
        logo: three_d_models,
    },
    {
        id: "client-4",
        logo: program_ace,
    },
];