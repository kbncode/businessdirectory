import { Body, Container, Head, Html, Link, Preview, Text } from "@react-email/components";
import { APP_URL, colors } from "./styles";

export interface PromotionSubmittedProps {
  title: string;
  type: string;
  businessName: string;
}

// Internal notification, not a customer-facing branded email — plain and
// functional on purpose, same as AdminNewSubmission.
export default function PromotionSubmitted({ title, type, businessName }: PromotionSubmittedProps) {
  const promotionsUrl = `${APP_URL}/admin/promotions`;

  return (
    <Html>
      <Head />
      <Preview>New promotion submitted for review: {title}</Preview>
      <Body style={{ fontFamily: "monospace", fontSize: "14px", color: colors.ink, padding: "16px" }}>
        <Container>
          <Text>New promotion submitted for review:</Text>
          <Text>
            Title: {title}
            <br />
            Type: {type}
            <br />
            Business: {businessName}
          </Text>
          <Text>
            <Link href={promotionsUrl}>{promotionsUrl}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
