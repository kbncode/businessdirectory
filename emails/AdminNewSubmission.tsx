import { Body, Container, Head, Html, Link, Preview, Text } from "@react-email/components";
import { APP_URL, colors } from "./styles";

export interface AdminNewSubmissionProps {
  businessName: string;
  category: string;
  city: string;
  submitterEmail: string;
}

// Internal notification, not a customer-facing branded email — plain and
// functional on purpose.
export default function AdminNewSubmission({
  businessName,
  category,
  city,
  submitterEmail,
}: AdminNewSubmissionProps) {
  const pendingUrl = `${APP_URL}/admin/pending`;

  return (
    <Html>
      <Head />
      <Preview>New business submission: {businessName}</Preview>
      <Body style={{ fontFamily: "monospace", fontSize: "14px", color: colors.ink, padding: "16px" }}>
        <Container>
          <Text>New business submission pending review:</Text>
          <Text>
            Business: {businessName}
            <br />
            Category: {category}
            <br />
            City: {city}
            <br />
            Submitted by: {submitterEmail}
          </Text>
          <Text>
            <Link href={pendingUrl}>{pendingUrl}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
