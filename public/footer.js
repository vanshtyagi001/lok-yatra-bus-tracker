// This function will be called by each page to load the footer
async function loadFooter(placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        console.warn(`Footer placeholder with ID "${placeholderId}" not found on this page.`);
        return;
    }

    try {
        // 1. Fetch the footer's HTML structure
        const response = await fetch('/components/footer.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const footerHtml = await response.text();
        placeholder.innerHTML = footerHtml;

        // 2. Add the footer's CSS to the page's head
        addFooterStyles();

        // 3. Dynamically set the copyright year
        const yearSpan = document.getElementById('footer-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }

    } catch (error) {
        console.error('Failed to load footer component:', error);
    }
}

function addFooterStyles() {
    // Check if the style is already added to prevent duplicates
    if (document.getElementById('mega-footer-styles')) return;

    const styles = `
        /* --- Mega Footer Styles --- */
        .mega-footer {
            background-color: #0f172a;
            color: #e2e8f0;
            padding: 50px 24px 0px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            border-top: 1px solid #1e293b;
            width: 100%;
            box-sizing: border-box;
        }

        .footer-container {
            max-width: 1100px;
            margin: 0 auto;
        }

        .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1.5fr;
            gap: 40px;
            margin-bottom: 40px;
        }

        .footer-col h3 {
            color: #ffffff;
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 20px;
            position: relative;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .footer-col h3::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: -6px;
            width: 20px;
            height: 2px;
            background-color: #3b82f6; /* Modern Blue Accent */
            border-radius: 2px;
        }

        .footer-col ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .footer-col ul li {
            margin-bottom: 12px;
        }

        .footer-col ul li a {
            color: #94a3b8;
            text-decoration: none;
            font-size: 0.88rem;
            transition: color 0.2s, transform 0.2s;
            display: inline-block;
        }

        .footer-col ul li a:hover {
            color: #3b82f6;
            transform: translateX(4px);
        }

        .brand-col {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .footer-logo-link {
            display: inline-block;
            align-self: flex-start;
        }

        .footer-logo {
            height: 38px;
            width: auto;
            display: block;
            filter: brightness(0) invert(1);
            opacity: 0.95;
        }

        .brand-desc {
            color: #94a3b8;
            font-size: 0.88rem;
            line-height: 1.6;
            max-width: 300px;
            margin: 0;
        }

        .social-links {
            display: flex;
            gap: 10px;
            margin-top: 5px;
        }

        .social-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            background-color: #1e293b;
            color: #94a3b8;
            border-radius: 50%;
            transition: background-color 0.25s, color 0.25s, transform 0.2s;
            text-decoration: none;
        }

        .social-icon:hover {
            background-color: #3b82f6;
            color: #ffffff;
            transform: translateY(-3px);
        }

        .social-icon svg {
            transition: transform 0.2s;
        }

        .contact-col {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #94a3b8;
            font-size: 0.88rem;
            margin: 0;
        }

        .contact-item svg {
            color: #3b82f6;
            flex-shrink: 0;
        }

        .footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 25px;
            border-top: 1px solid #1e293b;
            flex-wrap: wrap;
            gap: 16px;
        }

        .copyright {
            color: #64748b;
            font-size: 0.82rem;
            margin: 0;
        }

        .footer-legal {
            display: flex;
            gap: 20px;
        }

        .footer-legal a {
            color: #64748b;
            text-decoration: none;
            font-size: 0.82rem;
            transition: color 0.2s;
        }

        .footer-legal a:hover {
            color: #3b82f6;
        }

        /* --- Media Queries --- */
        @media (max-width: 868px) {
            .footer-grid {
                grid-template-columns: 1fr 1fr;
                gap: 30px;
            }
            .brand-col {
                grid-column: span 2;
            }
            .brand-desc {
                max-width: 100%;
            }
        }

        @media (max-width: 576px) {
            .footer-grid {
                grid-template-columns: 1fr;
                gap: 25px;
            }
            .brand-col {
                grid-column: span 1;
            }
            .footer-bottom {
                flex-direction: column;
                align-items: flex-start;
            }
            .footer-legal {
                width: 100%;
                justify-content: space-between;
            }
        }

        /* --- Trust Info Strip --- */
        .footer-trust-strip {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 0;
            margin: 30px 0;
            gap: 20px;
        }

        .trust-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: #94a3b8;
            transition: color 0.2s, transform 0.2s;
            cursor: default;
        }

        .trust-item:hover {
            color: #ffffff;
            transform: translateY(-1px);
        }

        .trust-icon {
            color: #3b82f6; /* Matching Contact Col SVG color (#3b82f6) */
            flex-shrink: 0;
            transition: color 0.2s;
        }

        .trust-item:hover .trust-icon {
            color: #60a5fa;
        }

        /* --- Attribution Strip --- */
        .footer-attribution-strip {
            background-color: #000000; /* Black color as background */
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding: 16px 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
            width: calc(100% + 48px); /* Offset the mega-footer padding */
            margin-left: -24px;
            margin-right: -24px;
            box-sizing: border-box;
            min-height: 56px;
            margin-top: 30px; /* Space above of footer-attribution-strip */
        }

        .attribution-container {
            max-width: 1100px;
            width: 100%;
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }

        .attr-link {
            color: #6366F1;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s, text-decoration 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 2px;
            position: relative;
        }

        .attr-link:hover {
            color: #818cf8;
            text-decoration: underline;
        }

        /* External Link Icon on Hover */
        .attr-link::after {
            content: "";
            width: 11px;
            height: 11px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366F1' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'%3E%3C/path%3E%3Cpolyline points='15 3 21 3 21 9'%3E%3C/polyline%3E%3Cline x1='10' y1='14' x2='21' y2='3'%3E%3C/line%3E%3C/svg%3E");
            background-size: contain;
            background-repeat: no-repeat;
            opacity: 0;
            transform: scale(0.8) translate(-1px, 1px);
            transition: opacity 0.2s, transform 0.2s;
            display: inline-block;
            margin-left: 3px;
        }

        .attr-link:hover::after {
            opacity: 1;
            transform: scale(1) translate(0, 0);
        }

        @media (max-width: 768px) {
            .footer-trust-strip {
                flex-direction: column;
                align-items: flex-start;
                gap: 16px;
                padding: 20px 0;
            }
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.id = 'mega-footer-styles';
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

// Export the loadFooter function so pages can import and call it
export { loadFooter };
