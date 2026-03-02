import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare, Search, ChevronRight, Clock, BookOpen, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ContactTopic {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const Contact = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "",
    subject: "",
    message: "",
    orderNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactTopics: ContactTopic[] = [
    {
      id: "account",
      label: "Account & Security",
      description: "Login issues, password reset, account verification",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      id: "orders",
      label: "Orders & Purchases",
      description: "Track orders, order cancellation, return issues",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      id: "payments",
      label: "Payments & Billing",
      description: "Payment methods, billing issues, refunds",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      id: "shipping",
      label: "Shipping & Delivery",
      description: "Shipping delays, tracking, address changes",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: "seller",
      label: "Become a Seller",
      description: "Seller registration, seller account setup",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      id: "other",
      label: "Something Else",
      description: "General inquiries and other issues",
      icon: <Mail className="h-5 w-5" />,
    },
  ];

  const faqArticles = [
    {
      category: "Account & Security",
      items: [
        "How do I reset my password?",
        "Why is my account locked?",
        "How do I enable two-factor authentication?",
      ],
    },
    {
      category: "Orders",
      items: [
        "How do I track my order?",
        "Can I cancel my order?",
        "What is my return policy?",
      ],
    },
    {
      category: "Payments",
      items: [
        "What payment methods do you accept?",
        "When will I get my refund?",
        "Is my payment information secure?",
      ],
    },
  ];

  const handleSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    setShowForm(true);
    setFormData({ ...formData, topic: topicId });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would send the data to your backend
      console.log("Contact form submitted:", formData);

      toast.success("Thank you! We've received your message. We'll get back to you within 24 hours.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        topic: "",
        subject: "",
        message: "",
        orderNumber: "",
      });
      setShowForm(false);
      setSelectedTopic(null);
    } catch (error) {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTopics = contactTopics.filter((topic) =>
    topic.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* ==================== HEADER ==================== */}
      <section className="bg-gradient-to-r from-primary to-accent py-12 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Contact Us</h1>
          <p className="text-lg text-white/90">We're here to help. Choose a topic or send us a message.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {!showForm ? (
          <>
            {/* ==================== SEARCH BAR ==================== */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for help or select a topic below..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary dark:bg-slate-900 dark:text-white text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* ==================== CONTACT TOPICS GRID ==================== */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {filteredTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleSelect(topic.id)}
                  className="text-left p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary dark:hover:border-primary hover:shadow-lg hover:bg-primary/5 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      {topic.icon}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {topic.label}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{topic.description}</p>
                </button>
              ))}
            </div>

            {/* ==================== FAQ SECTION ==================== */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-16">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Frequently Asked Questions</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {faqArticles.map((section, idx) => (
                  <div key={idx}>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">{section.category}</h3>
                    <ul className="space-y-3">
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx}>
                          <a
                            href="#"
                            className="text-primary hover:underline text-sm flex items-center gap-2 group"
                          >
                            <span>→</span>
                            <span>{item}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* ==================== SUPPORT CHANNELS ==================== */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Call Us</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Available Monday - Friday<br />9 AM - 6 PM EST
                </p>
                <a href="tel:1-800-CAMPUS-1" className="text-primary font-semibold hover:underline">
                  1-800-CAMPUS-1
                </a>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <Mail className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Email Us</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  We'll respond within<br />24 hours
                </p>
                <a href="mailto:support@campusmart.com" className="text-accent font-semibold hover:underline">
                  support@campusmart.com
                </a>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <MessageSquare className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Live Chat</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Chat with our support<br />team in real-time
                </p>
                <button className="text-blue-500 font-semibold hover:underline">Start Chat</button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ==================== CONTACT FORM ==================== */}
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setShowForm(false)}
                className="text-primary hover:underline mb-6 flex items-center gap-2"
              >
                ← Back to Topics
              </button>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Contact Form</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {contactTopics.find((t) => t.id === selectedTopic)?.label}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                      placeholder="Your name"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                      placeholder="(123) 456-7890"
                    />
                  </div>

                  {/* Order Number (if applicable) */}
                  {(selectedTopic === "orders" || selectedTopic === "shipping") && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Order Number
                      </label>
                      <input
                        type="text"
                        name="orderNumber"
                        value={formData.orderNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                        placeholder="e.g., ORD-2024-123456"
                      />
                    </div>
                  )}

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                      placeholder="Brief summary of your issue"
                      required
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white resize-none"
                      placeholder="Please provide as much detail as possible..."
                      required
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-primary text-white hover:bg-primary/90 rounded-lg py-2 font-semibold"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowForm(false)}
                      variant="outline"
                      className="flex-1 rounded-lg py-2 font-semibold"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>

                {/* Help Text */}
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    ℹ️ We typically respond to all inquiries within 24 hours. For urgent issues, please call us
                    at{" "}
                    <a href="tel:1-800-CAMPUS-1" className="font-semibold underline">
                      1-800-CAMPUS-1
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Contact;
