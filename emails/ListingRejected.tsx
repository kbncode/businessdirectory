import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import { APP_URL, LOGO_URL, colors, body, container, logo, heading, text, mutedText, buttonPrimary, hr, footer } from "./styles";

export interface ListingRejectedProps {
  businessName: string;
  rejectionReason: string;
}

export default function ListingRejected({ businessName, rejectionReason }: ListingRejectedProps) {
  const registerUrl = `${APP_URL}/register`;

  return (
    <Html>
      <Head />
      <Preview>An update on your KBN Business Directory submission</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img src={LOGO_URL} alt="KBN Business Directory" style={logo} />
          <Text style={heading}>Your listing wasn&apos;t approved</Text>
          <Text style={text}>
            Thanks for submitting <strong>{businessName}</strong>. After review, we weren&apos;t able to approve it
            this time.
          </Text>
          <Section
            style={{
              backgroundColor: colors.sand,
              borderRadius: "2px",
              padding: "12px 16px",
              margin: "0 0 16px",
            }}
          >
            <Text style={{ ...text, margin: 0, color: colors.stone }}>
              <strong style={{ color: colors.ink }}>Reason: </strong>
              {rejectionReason}
            </Text>
          </Section>
          <Text style={text}>
            You&apos;re welcome to fix the issue above and resubmit — we&apos;ll take another look.
          </Text>
          <Link href={registerUrl} style={buttonPrimary}>
            Resubmit your listing
          </Link>
          <Hr style={hr} />
          <Text style={footer}>KBN Business Directory — Kadiya Business Networking</Text>
        </Container>
      </Body>
    </Html>
  );
}
