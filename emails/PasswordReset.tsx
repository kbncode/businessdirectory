import { Body, Container, Head, Html, Img, Link, Preview, Text } from "@react-email/components";
import { LOGO_URL, body, container, logo, heading, text, mutedText, buttonPrimary, footer } from "./styles";

export interface PasswordResetProps {
  resetUrl: string;
}

export default function PasswordReset({ resetUrl }: PasswordResetProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your KBN Business Directory password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img src={LOGO_URL} alt="KBN Business Directory" style={logo} />
          <Text style={heading}>Reset your password</Text>
          <Text style={text}>
            We received a request to reset the password on your KBN Business Directory account. Click below to
            choose a new one — this link expires in 1 hour.
          </Text>
          <Link href={resetUrl} style={buttonPrimary}>
            Reset password
          </Link>
          <Text style={{ ...mutedText, marginTop: "24px" }}>
            If you didn&apos;t request this, you can safely ignore this email — your password will stay unchanged.
          </Text>
          <Text style={footer}>Kadiya Business Networking</Text>
        </Container>
      </Body>
    </Html>
  );
}
