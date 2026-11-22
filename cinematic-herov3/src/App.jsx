import NeonField from "./NeonField.jsx";
import React from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";


export default function App() {
  return (
    <main className="portfolio-shell">
      <NeonField />
      <div className="noise-layer" aria-hidden="true" />
      <header className="topbar">
        <a className="wordmark" href="#home" aria-label="Nibin home">
          <span className="wordmark-mark">N<span>.</span></span>
          <span className="wordmark-label">NIBIN MOIDEENKUTTY</span>
        </a>
        <div className="topbar-status"><span className="status-dot" /> AVAILABLE FOR SELECT PROJECTS</div>
        <a className="topbar-link" href="mailto:hello@nibin.dev">LET'S TALK <ArrowUpRight size={14} /></a>
      </header>

      <section className="hero" id="home">
        <div className="hero-meta">
          <span className="eyebrow"><span className="eyebrow-line" /> PORTFOLIO / 2026</span>
          <span className="coordinate">43°27' N&nbsp; 80°29' W</span>
        </div>

        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.15, ease: [0.2, 0.75, 0.25, 1] }}
        >
          <p className="intro-line">HELLO, WORLD <span className="intro-star">✳</span></p>
          <h1>Hi there.<br /><span>It's Nibin<span className="period">.</span></span></h1>
          <div className="hero-bottom">
            <p className="hero-description">
              I build thoughtful digital experiences<br className="desktop-break" />
              where <span>engineering meets imagination.</span>
            </p>
            <a className="explore-link" href="#about">
              <span>EXPLORE MY WORLD</span>
              <span className="explore-icon"><ArrowDownRight size={17} /></span>
            </a>
          </div>
        </motion.div>

        <div className="hero-side-note">
          <span className="side-rule" />
          <span>DESIGNING & ENGINEERING<br />WHAT'S NEXT</span>
        </div>

        <div className="hero-index"><span>01</span><i /> 04</div>
        <div className="scroll-cue"><span>SCROLL TO DISCOVER</span><span className="scroll-line" /></div>
      </section>

      <footer className="bottom-bar" id="about">
        <span>FULL STACK DEVELOPER <b>·</b> CREATIVE PROBLEM SOLVER</span>
        <span className="bottom-center">BUILT WITH CURIOSITY <span>↗</span></span>
        <a href="https://nibin.dev" target="_blank" rel="noreferrer">NIBIN.DEV <ArrowUpRight size={12} /></a>
      </footer>
    </main>
  );
}
