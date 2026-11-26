"use client";

import { Mail, Phone, MapPin } from "lucide-react";

const Linkedin = ({ width, height, className }: { width?: number; height?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width || 12}
    height={height || 12}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface PersonalInfo {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
}

interface WorkExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

interface Education {
  institution: string;
  degree: string;
  year: string;
}

interface CvPreviewProps {
  templateId: string;
  accentColor: string;
  personalInfo: PersonalInfo;
  experiences: WorkExperience[];
  skills: string[];
  education: Education[];
  isPrint?: boolean;
  photoUrl?: string;
  profileText?: string;
  language?: "es" | "en";
}

/* ─── Shared size tokens & localization helpers ──────────────────────────────── */
const sz = (isPrint: boolean) => ({
  name: isPrint ? "22pt" : "1.5em",
  headline: isPrint ? "12pt" : "0.9em",
  section: isPrint ? "9pt" : "0.75em",
  body: isPrint ? "10pt" : "0.7em",
  small: isPrint ? "8.5pt" : "0.65em",
  iconW: isPrint ? 12 : 7,
});

const getLabels = (language: "es" | "en" = "es") =>
  language === "en"
    ? {
        namePlaceholder: "Your Full Name",
        namePlaceholderUpper: "YOUR FULL NAME",
        shortNamePlaceholder: "Your Name",
        headlinePlaceholder: "Professional Title",
        rolePlaceholder: "Role",
        degreePlaceholder: "Degree",
        present: "Present",
        profProfile: "Professional Profile",
        profExperience: "Work Experience",
        profEducation: "Education",
        profSkills: "Skills",
        execSummary: "EXECUTIVE SUMMARY",
        execExperience: "PROFESSIONAL EXPERIENCE",
        execEducation: "EDUCATION",
        execSkills: "CORE COMPETENCIES",
        modContact: "CONTACT",
        modSkills: "SKILLS",
        modEducation: "EDUCATION",
        modAbout: "About Me",
        modExperience: "Experience",
        atsSummary: "PROFESSIONAL SUMMARY",
        atsExperience: "PROFESSIONAL EXPERIENCE",
        atsEducation: "EDUCATION",
        atsSkills: "TECHNICAL SKILLS",
      }
    : {
        namePlaceholder: "Tu Nombre Completo",
        namePlaceholderUpper: "TU NOMBRE COMPLETO",
        shortNamePlaceholder: "Tu Nombre",
        headlinePlaceholder: "Título Profesional",
        rolePlaceholder: "Cargo",
        degreePlaceholder: "Título",
        present: "Presente",
        profProfile: "Perfil Profesional",
        profExperience: "Experiencia Laboral",
        profEducation: "Educación",
        profSkills: "Habilidades",
        execSummary: "RESUMEN EJECUTIVO",
        execExperience: "TRAYECTORIA PROFESIONAL",
        execEducation: "FORMACIÓN",
        execSkills: "COMPETENCIAS",
        modContact: "CONTACTO",
        modSkills: "HABILIDADES",
        modEducation: "EDUCACIÓN",
        modAbout: "Sobre mí",
        modExperience: "Experiencia",
        atsSummary: "RESUMEN PROFESIONAL",
        atsExperience: "EXPERIENCIA PROFESIONAL",
        atsEducation: "EDUCACIÓN",
        atsSkills: "HABILIDADES TÉCNICAS",
      };

const cleanBullet = (text: string) =>
  text.replace(/^(?:[-–—•*▸►·]\s*)+/, "").trim();

const formatDateRange = (
  startDate: string,
  endDate: string,
  presentLabel: string,
  separator = "–"
) => {
  const start = startDate.trim();
  const end = endDate.trim();
  if (!start && !end) return "";
  if (start && end) return `${start} ${separator} ${end}`;
  if (start) return `${start} ${separator} ${presentLabel}`;
  return end;
};

/* ─── TEMPLATE 1: Profesional Clásico ───────────────────────────────────────── */
const TemplateProfesional = ({ personalInfo, experiences, skills, education, isPrint, photoUrl, profileText, accentColor, language }: CvPreviewProps) => {
  const s = sz(isPrint!);
  const l = getLabels(language);
  const validExp = experiences.filter((e) => e.company || e.role);
  const validEdu = education.filter((e) => e.institution || e.degree);

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: isPrint ? "11pt" : "7px", lineHeight: 1.45, color: "#1a1a1a", width: "100%", height: isPrint ? "auto" : "100%", minHeight: isPrint ? "auto" : "100%", padding: isPrint ? "16mm 18mm" : "10px 12px", boxSizing: "border-box", background: "#fff" }}>
      {/* Header strip */}
      <div style={{ borderBottom: `3px solid ${accentColor}`, paddingBottom: isPrint ? "14px" : "6px", marginBottom: isPrint ? "14px" : "6px", display: "flex", gap: isPrint ? "16px" : "8px", alignItems: "flex-start" }}>
        {photoUrl && (
          <div style={{ width: isPrint ? "80px" : "40px", height: isPrint ? "96px" : "48px", flexShrink: 0, overflow: "hidden", borderRadius: "4px", border: "1px solid #ddd" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: s.name, fontWeight: 700, color: accentColor, letterSpacing: "0.02em" }}>{personalInfo.name || l.namePlaceholder}</div>
          <div style={{ fontSize: s.headline, color: "#555", marginTop: isPrint ? "3px" : "2px", fontStyle: "italic" }}>{personalInfo.headline || l.headlinePlaceholder}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: isPrint ? "12px" : "5px", marginTop: isPrint ? "6px" : "3px" }}>
            {personalInfo.email && <span style={{ fontSize: s.small, color: "#666", display: "flex", alignItems: "center", gap: "3px" }}><Mail width={s.iconW} height={s.iconW} /> {personalInfo.email}</span>}
            {personalInfo.phone && <span style={{ fontSize: s.small, color: "#666", display: "flex", alignItems: "center", gap: "3px" }}><Phone width={s.iconW} height={s.iconW} /> {personalInfo.phone}</span>}
            {personalInfo.location && <span style={{ fontSize: s.small, color: "#666", display: "flex", alignItems: "center", gap: "3px" }}><MapPin width={s.iconW} height={s.iconW} /> {personalInfo.location}</span>}
            {personalInfo.linkedin && <span style={{ fontSize: s.small, color: "#666", display: "flex", alignItems: "center", gap: "3px" }}><Linkedin width={s.iconW} height={s.iconW} /> {personalInfo.linkedin}</span>}
          </div>
        </div>
      </div>

      {/* Profile */}
      {profileText && (
        <Section title={l.profProfile} accent={accentColor} isPrint={isPrint!}>
          <p style={{ fontSize: s.body, color: "#444", textAlign: "justify", lineHeight: 1.5 }}>{profileText}</p>
        </Section>
      )}

      {/* Experience */}
      {validExp.length > 0 && (
        <Section title={l.profExperience} accent={accentColor} isPrint={isPrint!}>
          {validExp.map((exp, i) => (
            <div key={i} style={{ marginBottom: isPrint ? "10px" : "5px", breakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: s.section, fontWeight: 700, color: "#1a1a1a" }}>{exp.role || l.rolePlaceholder}</span>
                <span style={{ fontSize: s.small, color: "#888", whiteSpace: "nowrap" }}>{formatDateRange(exp.startDate, exp.endDate, l.present, "–")}</span>
              </div>
              <div style={{ fontSize: s.small, color: accentColor, fontWeight: 600, marginBottom: "2px" }}>{exp.company}</div>
              {exp.bullets.map(cleanBullet).filter(Boolean).map((b, bi) => (
                <div key={bi} style={{ fontSize: s.body, color: "#555", paddingLeft: isPrint ? "10px" : "5px", lineHeight: 1.5 }}>• {b}</div>
              ))}
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {validEdu.length > 0 && (
        <Section title={l.profEducation} accent={accentColor} isPrint={isPrint!}>
          {validEdu.map((edu, i) => (
            <div key={i} style={{ marginBottom: isPrint ? "6px" : "3px", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", breakInside: "avoid" }}>
              <div>
                <div style={{ fontSize: s.section, fontWeight: 700, color: "#1a1a1a" }}>{edu.degree || l.degreePlaceholder}</div>
                <div style={{ fontSize: s.small, color: "#666" }}>{edu.institution}</div>
              </div>
              <span style={{ fontSize: s.small, color: "#888", whiteSpace: "nowrap" }}>{edu.year}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Section title={l.profSkills} accent={accentColor} isPrint={isPrint!}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: isPrint ? "5px" : "3px" }}>
            {skills.map((s2, i) => (
              <span key={i} style={{ fontSize: s.small, background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}40`, padding: isPrint ? "2px 8px" : "1px 4px", borderRadius: "3px", fontWeight: 600 }}>{s2}</span>
            ))}
          </div>
        </Section>
      )}

      {validExp.length === 0 && validEdu.length === 0 && <PlaceholderLines />}
    </div>
  );
};

/* ─── TEMPLATE 2: Ejecutivo ──────────────────────────────────────────────────── */
const TemplateEjecutivo = ({ personalInfo, experiences, skills, education, isPrint, photoUrl, profileText, accentColor, language }: CvPreviewProps) => {
  const s = sz(isPrint!);
  const l = getLabels(language);
  const darkBg = accentColor;
  const validExp = experiences.filter((e) => e.company || e.role);
  const validEdu = education.filter((e) => e.institution || e.degree);

  return (
    <div style={{ fontFamily: "'Arial', Helvetica, sans-serif", fontSize: isPrint ? "11pt" : "7px", lineHeight: 1.5, color: "#2d2d2d", width: "100%", height: isPrint ? "auto" : "100%", minHeight: isPrint ? "auto" : "100%", boxSizing: "border-box", background: "#ffffff" }}>
      {/* Full-width dark header */}
      <div style={{ background: darkBg, padding: isPrint ? "12mm 18mm" : "10px 14px", display: "flex", alignItems: "center", gap: isPrint ? "20px" : "8px" }}>
        {photoUrl && (
          <div style={{ width: isPrint ? "80px" : "36px", height: isPrint ? "80px" : "36px", flexShrink: 0, overflow: "hidden", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isPrint ? "24pt" : "1.6em", fontWeight: 800, color: "#ffffff", letterSpacing: "0.05em", textTransform: "uppercase" }}>{personalInfo.name || l.namePlaceholderUpper}</div>
          <div style={{ fontSize: isPrint ? "11pt" : "0.8em", color: "rgba(255,255,255,0.75)", marginTop: isPrint ? "4px" : "2px", fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase" }}>{personalInfo.headline || l.headlinePlaceholder}</div>
        </div>
      </div>
      {/* Contact bar */}
      <div style={{ background: `${darkBg}22`, borderBottom: `2px solid ${darkBg}`, padding: isPrint ? "4mm 18mm" : "3px 14px", display: "flex", flexWrap: "wrap", gap: isPrint ? "20px" : "8px" }}>
        {personalInfo.email && <span style={{ fontSize: s.small, color: "#555", display: "flex", alignItems: "center", gap: "3px" }}><Mail width={s.iconW} height={s.iconW} /> {personalInfo.email}</span>}
        {personalInfo.phone && <span style={{ fontSize: s.small, color: "#555", display: "flex", alignItems: "center", gap: "3px" }}><Phone width={s.iconW} height={s.iconW} /> {personalInfo.phone}</span>}
        {personalInfo.location && <span style={{ fontSize: s.small, color: "#555", display: "flex", alignItems: "center", gap: "3px" }}><MapPin width={s.iconW} height={s.iconW} /> {personalInfo.location}</span>}
        {personalInfo.linkedin && <span style={{ fontSize: s.small, color: "#555", display: "flex", alignItems: "center", gap: "3px" }}><Linkedin width={s.iconW} height={s.iconW} /> {personalInfo.linkedin}</span>}
      </div>

      <div style={{ padding: isPrint ? "10mm 18mm" : "8px 14px" }}>
        {profileText && (
          <EjecutivoSection title={l.execSummary} accent={darkBg} isPrint={isPrint!}>
            <p style={{ fontSize: s.body, color: "#555", textAlign: "justify", lineHeight: 1.6 }}>{profileText}</p>
          </EjecutivoSection>
        )}

        {validExp.length > 0 && (
          <EjecutivoSection title={l.execExperience} accent={darkBg} isPrint={isPrint!}>
            {validExp.map((exp, i) => (
              <div key={i} style={{ marginBottom: isPrint ? "12px" : "5px", paddingLeft: isPrint ? "12px" : "5px", borderLeft: `3px solid ${darkBg}`, breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: s.section, fontWeight: 700, color: "#1a1a1a" }}>{exp.role || l.rolePlaceholder}</span>
                  <span style={{ fontSize: s.small, color: "#999", fontStyle: "italic", whiteSpace: "nowrap" }}>{formatDateRange(exp.startDate, exp.endDate, l.present, "–")}</span>
                </div>
                <div style={{ fontSize: s.small, color: darkBg, fontWeight: 700, marginBottom: "3px" }}>{exp.company}</div>
                {exp.bullets.map(cleanBullet).filter(Boolean).map((b, bi) => (
                  <div key={bi} style={{ fontSize: s.body, color: "#555", paddingLeft: isPrint ? "10px" : "4px", lineHeight: 1.5 }}>▸ {b}</div>
                ))}
              </div>
            ))}
          </EjecutivoSection>
        )}

        <div style={{ display: "flex", gap: isPrint ? "24px" : "10px" }}>
          {validEdu.length > 0 && (
            <div style={{ flex: 1 }}>
              <EjecutivoSection title={l.execEducation} accent={darkBg} isPrint={isPrint!}>
                {validEdu.map((edu, i) => (
                  <div key={i} style={{ marginBottom: isPrint ? "6px" : "3px", breakInside: "avoid" }}>
                    <div style={{ fontSize: s.section, fontWeight: 700, color: "#1a1a1a" }}>{edu.degree}</div>
                    <div style={{ fontSize: s.small, color: "#777" }}>{edu.institution}{edu.year ? ` · ${edu.year}` : ""}</div>
                  </div>
                ))}
              </EjecutivoSection>
            </div>
          )}
          {skills.length > 0 && (
            <div style={{ flex: 1 }}>
              <EjecutivoSection title={l.execSkills} accent={darkBg} isPrint={isPrint!}>
                <div style={{ display: "flex", flexDirection: "column", gap: isPrint ? "3px" : "2px" }}>
                  {skills.map((sk, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: isPrint ? "6px" : "3px" }}>
                      <div style={{ width: isPrint ? "6px" : "3px", height: isPrint ? "6px" : "3px", borderRadius: "50%", background: darkBg, flexShrink: 0 }} />
                      <span style={{ fontSize: s.body, color: "#555" }}>{sk}</span>
                    </div>
                  ))}
                </div>
              </EjecutivoSection>
            </div>
          )}
        </div>
      </div>

      {validExp.length === 0 && validEdu.length === 0 && <PlaceholderLines />}
    </div>
  );
};

/* ─── TEMPLATE 3: Moderno con Sidebar ───────────────────────────────────────── */
const TemplateModerno = ({ personalInfo, experiences, skills, education, isPrint, photoUrl, profileText, accentColor, language }: CvPreviewProps) => {
  const s = sz(isPrint!);
  const l = getLabels(language);
  const validExp = experiences.filter((e) => e.company || e.role);
  const validEdu = education.filter((e) => e.institution || e.degree);

  return (
    <div style={{ fontFamily: "'Arial', Helvetica, sans-serif", fontSize: isPrint ? "11pt" : "7px", lineHeight: 1.45, color: "#1a1a1a", width: "100%", height: isPrint ? "auto" : "100%", minHeight: isPrint ? "296mm" : "100%", boxSizing: "border-box", background: "#fff", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: "36%", background: accentColor, color: "#fff", padding: isPrint ? "14mm 10mm" : "10px 8px", display: "flex", flexDirection: "column", gap: isPrint ? "16px" : "7px" }}>
        {photoUrl ? (
          <div style={{ width: isPrint ? "90px" : "42px", height: isPrint ? "90px" : "42px", borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.4)", alignSelf: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{ width: isPrint ? "80px" : "38px", height: isPrint ? "80px" : "38px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center", fontSize: isPrint ? "28pt" : "1.4em", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
            {personalInfo.name ? personalInfo.name.charAt(0).toUpperCase() : "U"}
          </div>
        )}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: isPrint ? "16pt" : "1em", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{personalInfo.name || l.shortNamePlaceholder}</div>
          <div style={{ fontSize: s.small, color: "rgba(255,255,255,0.7)", marginTop: "3px" }}>{personalInfo.headline || l.headlinePlaceholder}</div>
        </div>
        <SidebarDivider />
        <div style={{ display: "flex", flexDirection: "column", gap: isPrint ? "5px" : "3px" }}>
          <SidebarLabel label={l.modContact} />
          {personalInfo.email && <SidebarItem icon={<Mail width={s.iconW} height={s.iconW} />} text={personalInfo.email} />}
          {personalInfo.phone && <SidebarItem icon={<Phone width={s.iconW} height={s.iconW} />} text={personalInfo.phone} />}
          {personalInfo.location && <SidebarItem icon={<MapPin width={s.iconW} height={s.iconW} />} text={personalInfo.location} />}
          {personalInfo.linkedin && <SidebarItem icon={<Linkedin width={s.iconW} height={s.iconW} />} text={personalInfo.linkedin} />}
        </div>
        {skills.length > 0 && (
          <>
            <SidebarDivider />
            <SidebarLabel label={l.modSkills} />
            <div style={{ display: "flex", flexDirection: "column", gap: isPrint ? "4px" : "2px" }}>
              {skills.map((sk, i) => (
                <div key={i} style={{ fontSize: s.body, color: "rgba(255,255,255,0.85)", paddingLeft: "5px" }}>· {sk}</div>
              ))}
            </div>
          </>
        )}
        {validEdu.length > 0 && (
          <>
            <SidebarDivider />
            <SidebarLabel label={l.modEducation} />
            {validEdu.map((edu, i) => (
              <div key={i} style={{ marginBottom: "4px", breakInside: "avoid" }}>
                <div style={{ fontSize: s.body, fontWeight: 700, color: "#fff" }}>{edu.degree}</div>
                <div style={{ fontSize: s.small, color: "rgba(255,255,255,0.65)" }}>{edu.institution}</div>
                <div style={{ fontSize: s.small, color: "rgba(255,255,255,0.5)" }}>{edu.year}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: isPrint ? "14mm 14mm" : "10px 10px", display: "flex", flexDirection: "column", gap: isPrint ? "14px" : "7px" }}>
        {profileText && (
          <div>
            <ModernSectionTitle title={l.modAbout} accent={accentColor} isPrint={isPrint!} />
            <p style={{ fontSize: s.body, color: "#555", lineHeight: 1.6, textAlign: "justify" }}>{profileText}</p>
          </div>
        )}
        {validExp.length > 0 && (
          <div>
            <ModernSectionTitle title={l.modExperience} accent={accentColor} isPrint={isPrint!} />
            {validExp.map((exp, i) => (
              <div key={i} style={{ marginBottom: isPrint ? "10px" : "5px", breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: s.section, fontWeight: 700, color: "#1a1a1a" }}>{exp.role}</span>
                  <span style={{ fontSize: s.small, color: "#aaa", fontStyle: "italic", whiteSpace: "nowrap" }}>{formatDateRange(exp.startDate, exp.endDate, l.present, "–")}</span>
                </div>
                <div style={{ fontSize: s.small, color: accentColor, fontWeight: 600, marginBottom: "2px" }}>{exp.company}</div>
                {exp.bullets.map(cleanBullet).filter(Boolean).map((b, bi) => (
                  <div key={bi} style={{ fontSize: s.body, color: "#666", paddingLeft: isPrint ? "8px" : "4px", lineHeight: 1.5 }}>• {b}</div>
                ))}
              </div>
            ))}
          </div>
        )}
        {validExp.length === 0 && validEdu.length === 0 && <PlaceholderLines />}
      </div>
    </div>
  );
};

/* ─── TEMPLATE 4: ATS Puro ───────────────────────────────────────────────────── */
const TemplateAts = ({ personalInfo, experiences, skills, education, isPrint, profileText, language }: CvPreviewProps) => {
  const s = sz(isPrint!);
  const l = getLabels(language);
  const validExp = experiences.filter((e) => e.company || e.role);
  const validEdu = education.filter((e) => e.institution || e.degree);
  const contactItems = [
    personalInfo.email?.trim(),
    personalInfo.phone?.trim(),
    personalInfo.location?.trim(),
    personalInfo.linkedin?.trim(),
  ].filter(Boolean) as string[];

  return (
    <div style={{ fontFamily: "'Arial', Helvetica, sans-serif", fontSize: isPrint ? "11pt" : "7px", lineHeight: 1.55, color: "#000", width: "100%", height: isPrint ? "auto" : "100%", minHeight: isPrint ? "auto" : "100%", padding: isPrint ? "16mm 18mm" : "8px 12px", boxSizing: "border-box", background: "#fff" }}>
      {/* Header: strict single-column plain text for maximum ATS parseability */}
      <div style={{ textAlign: "center", marginBottom: isPrint ? "12px" : "5px", borderBottom: "1px solid #000", paddingBottom: isPrint ? "8px" : "4px", color: "#000" }}>
        <div style={{ fontSize: isPrint ? "18pt" : "1.2em", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#000" }}>{personalInfo.name || l.namePlaceholderUpper}</div>
        <div style={{ fontSize: s.section, fontWeight: 600, marginTop: isPrint ? "2px" : "1px", color: "#000" }}>{personalInfo.headline || l.headlinePlaceholder}</div>
        {contactItems.length > 0 && (
          <div style={{ fontSize: s.small, marginTop: isPrint ? "4px" : "2px", color: "#000" }}>
            {contactItems.join(" | ")}
          </div>
        )}
      </div>

      {profileText && (
        <AtsSection title={l.atsSummary} isPrint={isPrint!}>
          <p style={{ fontSize: s.body, lineHeight: 1.55, color: "#000", margin: 0 }}>{profileText}</p>
        </AtsSection>
      )}

      {validExp.length > 0 && (
        <AtsSection title={l.atsExperience} isPrint={isPrint!}>
          {validExp.map((exp, i) => (
            <div key={i} style={{ marginBottom: isPrint ? "10px" : "4px", color: "#000", breakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", color: "#000" }}>
                <strong style={{ fontSize: s.section, color: "#000" }}>{exp.role || l.rolePlaceholder}</strong>
                <span style={{ fontSize: s.small, color: "#000", whiteSpace: "nowrap" }}>{formatDateRange(exp.startDate, exp.endDate, l.present, "-")}</span>
              </div>
              <div style={{ fontSize: s.small, fontWeight: 600, color: "#000", marginBottom: isPrint ? "2px" : "1px" }}>{exp.company}</div>
              {exp.bullets.map(cleanBullet).filter(Boolean).map((b, bi) => (
                <div key={bi} style={{ fontSize: s.body, paddingLeft: isPrint ? "12px" : "5px", color: "#000", lineHeight: 1.5 }}>- {b}</div>
              ))}
            </div>
          ))}
        </AtsSection>
      )}

      {validEdu.length > 0 && (
        <AtsSection title={l.atsEducation} isPrint={isPrint!}>
          {validEdu.map((edu, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: isPrint ? "4px" : "2px", color: "#000", breakInside: "avoid" }}>
              <div style={{ color: "#000" }}>
                <strong style={{ fontSize: s.section, color: "#000" }}>{edu.degree}</strong>
                <div style={{ fontSize: s.small, color: "#000" }}>{edu.institution}</div>
              </div>
              <span style={{ fontSize: s.small, color: "#000", whiteSpace: "nowrap" }}>{edu.year}</span>
            </div>
          ))}
        </AtsSection>
      )}

      {skills.length > 0 && (
        <AtsSection title={l.atsSkills} isPrint={isPrint!}>
          <p style={{ fontSize: s.body, color: "#000", margin: 0 }}>{skills.join(" | ")}</p>
        </AtsSection>
      )}

      {validExp.length === 0 && validEdu.length === 0 && <PlaceholderLines />}
    </div>
  );
};

/* ─── Sub-components ─────────────────────────────────────────────────────────── */
const Section = ({ title, accent, isPrint, children }: { title: string; accent: string; isPrint: boolean; children: React.ReactNode }) => (
  <div style={{ marginBottom: isPrint ? "12px" : "6px" }}>
    <div style={{ fontSize: isPrint ? "9pt" : "0.7em", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1.5px solid ${accent}`, paddingBottom: isPrint ? "3px" : "2px", marginBottom: isPrint ? "6px" : "3px" }}>{title}</div>
    {children}
  </div>
);

const EjecutivoSection = ({ title, accent, isPrint, children }: { title: string; accent: string; isPrint: boolean; children: React.ReactNode }) => (
  <div style={{ marginBottom: isPrint ? "12px" : "6px" }}>
    <div style={{ fontSize: isPrint ? "8.5pt" : "0.65em", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: isPrint ? "6px" : "3px", display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ height: "1px", width: "100%", background: `${accent}40` }} />
      <span style={{ whiteSpace: "nowrap" }}>{title}</span>
      <div style={{ height: "1px", width: "100%", background: `${accent}40` }} />
    </div>
    {children}
  </div>
);

const ModernSectionTitle = ({ title, accent, isPrint }: { title: string; accent: string; isPrint: boolean }) => (
  <div style={{ fontSize: isPrint ? "9pt" : "0.7em", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `2px solid ${accent}`, paddingBottom: isPrint ? "3px" : "1px", marginBottom: isPrint ? "6px" : "3px" }}>{title}</div>
);

const AtsSection = ({ title, isPrint, children }: { title: string; isPrint: boolean; children: React.ReactNode }) => (
  <div style={{ marginBottom: isPrint ? "10px" : "4px", color: "#000" }}>
    <div style={{ fontSize: isPrint ? "9pt" : "0.7em", fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid #000", paddingBottom: isPrint ? "2px" : "1px", marginBottom: isPrint ? "5px" : "2px", color: "#000" }}>{title}</div>
    {children}
  </div>
);

const SidebarLabel = ({ label }: { label: string }) => (
  <div style={{ fontSize: "0.65em", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>{label}</div>
);

const SidebarItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.65em", color: "rgba(255,255,255,0.8)", wordBreak: "break-all" }}>
    {icon} {text}
  </div>
);

const SidebarDivider = () => (
  <div style={{ height: "1px", background: "rgba(255,255,255,0.2)", margin: "2px 0" }} />
);

const PlaceholderLines = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px", opacity: 0.15 }}>
    {[80, 65, 90, 55, 70, 60].map((w, i) => (
      <div key={i} style={{ height: "6px", borderRadius: "3px", background: "#888", width: `${w}%` }} />
    ))}
  </div>
);

/* ─── Main Export ────────────────────────────────────────────────────────────── */
const CvPreview = (props: CvPreviewProps) => {
  switch (props.templateId) {
    case "ejecutivo":
      return <TemplateEjecutivo {...props} />;
    case "moderno":
    case "creativo": // backwards compat
      return <TemplateModerno {...props} />;
    case "ats":
      return <TemplateAts {...props} />;
    case "profesional":
    default:
      return <TemplateProfesional {...props} />;
  }
};

export default CvPreview;
