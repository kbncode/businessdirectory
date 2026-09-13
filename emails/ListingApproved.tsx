import { Body, Container, Head, Html, Img, Link, Preview, Text } from "@react-email/components";
import { APP_URL, LOGO_URL, body, container, logo, heading, text, mutedText, buttonPrimary, footer } from "./styles";

export interface ListingApprovedProps {
  businessName: string;
  businessId: string;
}

export default function ListingApproved({ businessName, businessId }: ListingApprovedProps) {
  const listingUrl = `${APP_URL}/business/${businessId}`;

  return (
    <Html>
      <Head />
      <Preview>Your listing is now live on KBN Business Directory</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img src={LOGO_URL} alt="KBN Business Directory" style={logo} />
          <Text style={heading}>Your listing is live 🎉</Text>
          <Text style={text}>
            Good news — <strong>{businessName}</strong> has been approved and is now visible on KBN Business
            Directory.
          </Text>
          <Link href={listingUrl} style={buttonPrimary}>
            View your listing
          </Link>
          <Text style={{ ...mutedText, marginTop: "24px" }}>— KBN Business Directory</Text>
          <Text style={footer}>Kadiya Business Networking</Text>
        </Container>
      </Body>
    </Html>
  );
}
