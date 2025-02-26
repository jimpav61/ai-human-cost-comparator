
import { supabase } from '@/lib/supabase';

export const sendEmail = async (to: string, subject: string, message: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, message },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
