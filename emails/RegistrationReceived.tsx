import { Body, Container, Head, Html, Img, Preview, Text } from "@react-email/components";
import { LOGO_URL, body, container, logo, heading, text, mutedText, footer } from "./styles";

export interface RegistrationReceivedProps {
  businessName: string;
}

export default function RegistrationReceived({ businessName }: RegistrationReceivedProps) {
  return (
    <Html>
      <Head />
      <Preview>We've received your business listing submission</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img src={LOGO_URL} alt="KBN Business Directory" style={logo} />
          <Text style={heading}>Submission received</Text>
          <Text style={text}>
            Thanks for submitting <strong>{businessName}</strong> to KBN Business Directory. We&apos;ve received it
            and it&apos;s now pending admin review.
          </Text>
          <Text style={text}>
            We&apos;ll email you as soon as it&apos;s been approved and is live on the directory.
          </Text>
          <Text style={mutedText}>— KBN Business Directory</Text>
          <Text style={footer}>Kadiya Business Networking</Text>
        </Container>
      </Body>
    </Html>
  );
}
