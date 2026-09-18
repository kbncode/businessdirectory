import { Body, Container, Head, Html, Img, Link, Preview, Text } from "@react-email/components";
import { APP_URL, LOGO_URL, body, container, logo, heading, text, mutedText, buttonPrimary, footer } from "./styles";

export interface PromotionApprovedProps {
  title: string;
  businessName: string;
  businessSlug: string;
}

export default function PromotionApproved({ title, businessName, businessSlug }: PromotionApprovedProps) {
  const listingUrl = `${APP_URL}/business/${businessSlug}`;

  return (
    <Html>
      <Head />
      <Preview>Your promotion is now live on KBN Business Directory</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img src={LOGO_URL} alt="KBN Business Directory" style={logo} />
          <Text style={heading}>Your promotion is live 🎉</Text>
          <Text style={text}>
            Good news — <strong>{title}</strong> for <strong>{businessName}</strong> has been approved and is now
            live.
          </Text>
          <Link href={listingUrl} style={buttonPrimary}>
            View your business page
          </Link>
          <Text style={{ ...mutedText, marginTop: "24px" }}>— KBN Business Directory</Text>
          <Text style={footer}>Kadiya Business Networking</Text>
        </Container>
      </Body>
    </Html>
  );
}
