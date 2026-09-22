'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, MessageSquare, Phone, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button, Input } from '@/components/ui';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface px-3 py-1 text-xs font-bold text-primary">
          <Mail size={14} /> Get in Touch
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-content-primary sm:text-5xl">
          Contact Us
        </h1>
        <p className="mx-auto max-w-2xl text-base text-content-tertiary">
          Have questions about an order, wholesale pricing, or becoming a supplier? We are here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Contact Info Cards */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-edge bg-surface p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-content-primary">Email Support</h3>
              <p className="text-xs text-content-tertiary mt-0.5">
                Our support desk responds within 24 business hours.
              </p>
              <a
                href="mailto:support@sathunglobal.com"
                className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
              >
                support@sathunglobal.com
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-edge bg-surface p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-content-primary">Direct Chat</h3>
              <p className="text-xs text-content-tertiary mt-0.5">
                For order-specific inquiries, message your supplier directly through our integrated chat.
              </p>
              <Link
                href="/chat"
                className="mt-2 inline-block text-sm font-semibold text-secondary hover:underline"
              >
                Open Chat &rarr;
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-edge bg-surface p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent-dark">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-content-primary">Operating Entity</h3>
              <p className="text-sm font-medium text-content-secondary mt-0.5">
                Thakuri Brand
              </p>
              <p className="text-xs text-content-tertiary">
                Cyprus &bull; Global Dropshipping Marketplace
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-2xl border border-edge bg-surface p-6 sm:p-8 lg:col-span-2">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-content-primary">Message Received</h3>
              <p className="max-w-md text-sm text-content-tertiary">
                Thank you for contacting us. A member of our support team will review your inquiry and get back to you shortly.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSent(false);
                  setMessage('');
                  setSubject('');
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-2xl font-bold text-content-primary">Send us a Message</h2>
              <p className="text-sm text-content-tertiary">
                Fill out the form below and we will get back to you as soon as possible.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-content-tertiary">
                    Your Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-content-tertiary">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-content-tertiary">
                  Subject
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Order Inquiry / Wholesale / General Question"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-content-tertiary">
                  Message
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  required
                  className="w-full rounded-xl border border-edge bg-surface-page px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-tertiary focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-content-tertiary">
                  <ShieldCheck size={14} className="text-success" />
                  Your information is kept private & secure.
                </span>
                <Button type="submit" className="flex items-center gap-2">
                  <Send size={15} /> Send Message
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
