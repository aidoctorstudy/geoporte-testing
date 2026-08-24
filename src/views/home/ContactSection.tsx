import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import { contact, offices } from "@/lib/company";
import { ContactTerrain } from "./ContactTerrain";

export const ContactSection = () => {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="bg-background-alt/40 border-line relative overflow-hidden border-t py-24 md:py-32"
    >
      <ContactTerrain />
      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeading
          id="contact-heading"
          eyebrow="Get in touch"
          heading="Ready to engineer with confidence in complex ground?"
        />

        <Inview
          tag="div"
          mode="once"
          from={{ opacity: 0, y: 24 }}
          to={{ opacity: 1, y: 0 }}
          className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr]"
        >
          <address className="text-foreground not-italic">
            <p>
              <a
                href={`mailto:${contact.email}`}
                className="hover:text-accent transition-colors duration-[var(--duration-fast)] ease-entrance text-2xl font-medium"
              >
                {contact.email}
              </a>
            </p>
            <p className="text-foreground-muted mt-2 text-sm">
              {contact.responseTime}
            </p>
            <ul className="mt-6 flex flex-col gap-2">
              {contact.phones.map((phone) => (
                <li key={phone.number} className="text-foreground-muted text-sm">
                  <a
                    href={`tel:${phone.number.replace(/[^+\d]/g, "")}`}
                    className="hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance"
                  >
                    {phone.number}
                  </a>{" "}
                  <span className="text-foreground-muted/60">
                    ({phone.region})
                  </span>
                </li>
              ))}
            </ul>
          </address>

          <ul className="grid grid-cols-2 gap-x-8 gap-y-8">
            {offices.map((office) => (
              <li key={office.city}>
                <address className="not-italic">
                  <p className="text-foreground font-medium">{office.city}</p>
                  <p className="text-foreground-muted mt-1 text-sm">
                    {office.country}
                  </p>
                  <p className="text-foreground-muted/80 mt-2 text-sm">
                    {office.address}
                  </p>
                </address>
              </li>
            ))}
          </ul>
        </Inview>
      </div>
    </section>
  );
};
