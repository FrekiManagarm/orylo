"use client";

import Footer from "@/components/landing/footer";
import Navbar from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { useState } from "react";

export function ContactContent() {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Simulate submission
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Just a visual feedback for now
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-400">
      <Navbar />
      
      <main className="pt-32 pb-20">
        {/* Background Gradients */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-900/20 blur-[120px] opacity-30" />
           <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-900/20 blur-[120px] opacity-30" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight"
            >
              Contact Us
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-zinc-400 max-w-2xl mx-auto"
            >
              A question about our solution? Need a custom demo? 
              Our team is here to help.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="p-8 rounded-2xl bg-zinc-900/50 border border-white/10">
                <h3 className="text-xl font-bold mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-white mb-1">Email</div>
                      <a href="mailto:contact@orylo.com" className="text-zinc-400 hover:text-indigo-400 transition-colors">
                        contact@orylo.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-white mb-1">Office</div>
                      <p className="text-zinc-400">
                        123 Innovation Avenue<br />
                        75001 Paris, France
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-white mb-1">Support</div>
                      <p className="text-zinc-400">
                        Available 24/7 for our Enterprise clients.<br />
                        Mon - Fri, 9am - 6pm for everyone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-linear-to-br from-indigo-900/20 to-purple-900/20 border border-white/10">
                <h3 className="text-xl font-bold mb-4">FAQ</h3>
                <p className="text-zinc-400 mb-4">
                  Have technical questions? Check our documentation for quick answers.
                </p>
                <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
                  View Documentation
                </Button>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-zinc-900 border border-white/10 space-y-6">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                    <p className="text-zinc-400">
                      Thank you for contacting us. We will get back to you as soon as possible.
                    </p>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="mt-6 text-indigo-400"
                      onClick={() => setSubmitted(false)}
                    >
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstname" className="text-zinc-400">First Name</Label>
                        <Input id="firstname" name="firstname" placeholder="John" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastname" className="text-zinc-400">Last Name</Label>
                        <Input id="lastname" name="lastname" placeholder="Doe" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-zinc-400">Work Email</Label>
                      <Input id="email" name="email" type="email" placeholder="john@company.com" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-zinc-400">Company</Label>
                      <Input id="company" name="company" placeholder="Your Company" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-zinc-400">Message</Label>
                      <Textarea 
                        id="message" 
                        name="message" 
                        placeholder="Tell us more about your needs..." 
                        className="min-h-[150px] bg-black/50 border-white/10 text-white placeholder:text-zinc-600" 
                        required 
                      />
                    </div>

                    <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200">
                      Send Message
                    </Button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

