'use client';

/**
 * Help Center — port of mobile `app/help.tsx`.
 *
 * The guidance copy is mobile's, verbatim. Mobile has no question/answer FAQ
 * list: the "help" content is this checklist of what to include plus the caveats
 * below it, so that is what is ported rather than inventing Q&A pairs.
 *
 * Tickets are written to `support_tickets` with `{ user_id, email, description }`
 * exactly as mobile does — `status` is left to the column default ('pending').
 * RLS allows INSERT only when `auth.uid() = user_id`, so the form needs a
 * signed-in user; the copy stays readable for guests.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Send, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button, Card, EmptyState, Tabs, Textarea } from '@/components/ui';
import type { SupportTicket } from '@/types/database';

const INCLUDE_LIST = [
  'Your registered email address',
  'Order ID (if applicable)',
  'Product name or details',
  'A clear description of the issue',
  'Screenshots or supporting evidence, if available',
];

const NOTE_LIST = [
  'Order processing and shipping updates may take some time to appear.',
  'Delivery times may vary depending on the destination country and shipping method.',
  'Refunds and returns are subject to our policies and eligibility requirements.',
  'Incomplete information may result in delays in resolving your request.',
];

const NEXT_STEPS = [
  'Our support team will review your request.',
  'If additional information is required, we will contact you using your registered email address.',
  'Once the review is completed, you will receive an update regarding the status of your request.',
];

/** Mobile's per-status icon + colour mapping for the ticket list. */
function statusVisual(status: string | null) {
  switch (status) {
    case 'resolved':
      return { Icon: CheckCircle, className: 'text-success' };
    case 'in_progress':
      return { Icon: Clock, className: 'text-info' };
    case 'closed':
      return { Icon: XCircle, className: 'text-content-tertiary' };
    default:
      return { Icon: AlertCircle, className: 'text-warning' };
  }
}

export function SupportCenter({
  userId,
  email,
  tickets,
}: {
  userId: string | null;
  email: string | null;
  tickets: SupportTicket[];
}) {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [tab, setTab] = useState<'submit' | 'tickets'>('submit');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Please enter your request details.');
      return;
    }
    if (!userId) {
      setError('You must be logged in to submit a request.');
      return;
    }

    setError(null);
    setLoading(true);

    const { error: insertError } = await createClient()
      .from('support_tickets')
      .insert([
        {
          user_id: userId,
          email: email || 'No email provided',
          description: description.trim(),
        },
      ]);

    setLoading(false);

    if (insertError) {
      setError(insertError.message || 'Failed to submit request. Please try again.');
      return;
    }

    setSubmitted(true);
    setDescription('');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
        {t.helpCenter ?? 'Help Center'}
      </h1>

      {userId && (
        <Tabs
          tabs={[
            { key: 'submit', label: 'Submit Request' },
            { key: 'tickets', label: 'My Tickets', count: tickets.length },
          ]}
          active={tab}
          onChange={(key) => setTab(key as 'submit' | 'tickets')}
        />
      )}

      {tab === 'submit' ? (
        submitted ? (
          <Card className="space-y-4 p-5">
            <h2 className="text-4xl font-extrabold text-content-primary">Request Submitted</h2>
            <Paragraph>Thank you for contacting our Support Team.</Paragraph>
            <Paragraph>
              We have successfully received your request and our team will review the information
              you provided, including your account details, email address, order information, and
              any attachments or screenshots submitted with your request.
            </Paragraph>
            <Paragraph>
              Your support ticket has been recorded and is currently being processed. Please allow
              our team some time to investigate the issue and provide the most accurate solution.
            </Paragraph>
            <Paragraph>What happens next?</Paragraph>
            <Bullets items={NEXT_STEPS} />
            <Paragraph>
              Please note that response times may vary depending on the complexity of the issue and
              the volume of support requests currently being handled.
            </Paragraph>
            <Paragraph>
              We kindly ask that you avoid submitting multiple requests regarding the same issue, as
              this may cause delays in processing your ticket.
            </Paragraph>
            <Paragraph>
              Thank you for your patience and understanding. We appreciate your trust in our
              platform and will do our best to assist you as quickly as possible.
            </Paragraph>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Submit another request
              </Button>
              <Button variant="outline" onClick={() => setTab('tickets')}>
                View my tickets
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card className="space-y-4 p-5">
              <h2 className="text-4xl font-extrabold text-content-primary">
                Welcome to our Help Center!
              </h2>
              <Paragraph>
                Thank you for using our platform. We are committed to providing you with a smooth
                and reliable dropshipping experience. If you are experiencing any issues or have
                questions regarding your account, orders, products, shipping, payments, or any
                other service, our support team is here to assist you.
              </Paragraph>
              <Paragraph>
                Before contacting support, please ensure that you have checked the relevant
                information within the app, as many common questions can be resolved through the
                available settings and order details.
              </Paragraph>
              <Paragraph>
                For faster assistance, please include the following information when submitting your
                request:
              </Paragraph>
              <Bullets items={INCLUDE_LIST} />
              <Paragraph>Please note:</Paragraph>
              <Bullets items={NOTE_LIST} />
              <Paragraph>
                Our support team will review your inquiry and respond as soon as possible. We
                appreciate your patience and thank you for choosing our platform.
              </Paragraph>
              <Paragraph>
                We are always working to improve our services and provide the best possible
                experience for our users.
              </Paragraph>
              <Paragraph>
                Best Regards,
                <br />
                Support Team
              </Paragraph>
            </Card>

            <Card className="space-y-3.5 p-5">
              <h2 className="text-2xl font-bold text-content-primary">Submit a Request</h2>

              {userId ? (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <Textarea
                    rows={6}
                    placeholder="Type your request here..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  {error && <p className="text-md font-bold text-error">{error}</p>}
                  <Button type="submit" loading={loading}>
                    <Send size={18} />
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </form>
              ) : (
                <>
                  <p className="text-lg text-content-tertiary">
                    Sign in to open a support ticket — tickets are attached to your account so we
                    can reply to your registered email address.
                  </p>
                  <Link href="/login?next=/help" className="w-fit">
                    <Button>{t.signIn ?? 'Sign In'}</Button>
                  </Link>
                </>
              )}
            </Card>
          </>
        )
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<AlertCircle size={26} />}
          title="No support tickets found."
          message="Anything you submit here will show up in this list with its current status."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {tickets.map((ticket, index) => {
            const { Icon, className } = statusVisual(ticket.status);

            return (
              <motion.li
                key={ticket.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 24,
                  delay: Math.min(index * 0.05, 0.3),
                }}
                className="rounded-2xl border border-edge bg-surface p-4"
              >
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-content-tertiary">
                    {new Date(ticket.created_at).toLocaleDateString(language.code)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-3xl border border-current px-2 py-1 text-2xs font-extrabold uppercase ${className}`}
                  >
                    <Icon size={12} />
                    {(ticket.status ?? 'pending').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-md text-content-primary">
                  {ticket.description}
                </p>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-lg leading-6 text-content-secondary">{children}</p>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1 pl-2">
      {items.map((item) => (
        <li key={item} className="text-lg leading-6 text-content-secondary">
          • {item}
        </li>
      ))}
    </ul>
  );
}
