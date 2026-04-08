# 🛡️ PhishShield Triage Tool

PhishShield is a high-performance email triage and analysis tool designed for SOC (Security Operations Center) analysts. It automates the extraction and heuristic analysis of email headers and body content to identify phishing, spoofing, and Business Email Compromise (BEC) attempts.

Built with the **BTL1 (Blue Team Level 1) Framework** principles in mind.

## 🚀 Key Features

- **Advanced Heuristic Engine**: Real-time risk scoring based on industry-standard phishing indicators.
- **Header Parsing (RFC 5322)**: Automatic extraction of Sender IP, SPF/DKIM/DMARC status, and identity mismatches.
- **Security Logic**:
  - **Typosquatting Detection**: Identifies domains mimicking major brands (Amazon, Microsoft, DHL, etc.).
  - **BEC Identification**: Flags discrepancies between `From` and `Return-Path` headers.
  - **Urgency Analysis**: Scans for social engineering keywords (Urgent, Locked, Action Required).
  - **URL Triage**: Detects shortened URLs, IP-based links, and tracking pixels.
- **Local Persistence**: Save analysis history and manage domain whitelists directly in your browser.
- **Tactical UI**: Premium dark-mode interface designed for high-pressure security environments.

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Styling**: Vanilla CSS (Tactical Design System)
- **Logic**: Custom Heuristic Parser (Standalone JS)
- **Storage**: Browser LocalStorage

## 💻 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AlbertCasadoVieco/PhishShield-Triage-Tool.git
   ```
2. Navigate to the project directory:
   ```bash
   cd PhishShield-Triage-Tool
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Usage

1. **Paste Header**: Obtain the RAW internet headers from Outlook/Gmail and paste them into the "Header" field.
2. **Paste Body**: Copy the email's body text (or HTML) and paste it into the "Body" field.
3. **Run Analysis**: Click "RUN ANALYSIS" to generate a tactical verdict and list of forensic triggers.
4. **Save to History**: Track your triage logs locally for future audit.

---
**BTL1 Framework Integrated | API v1.0-Local**
