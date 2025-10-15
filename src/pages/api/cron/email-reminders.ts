// Vercel Cron API route for email reminders
// This runs automatically based on the schedule in vercel.json

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting automated email reminder check...');

    // Call the auto-reminder-trigger function
    const response = await fetch(
      `${process.env.VITE_SUPABASE_URL}/functions/v1/auto-reminder-trigger`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Reminder check completed:', data);

    return res.status(200).json({
      success: true,
      message: 'Email reminders processed successfully',
      data: data,
    });
  } catch (error: any) {
    console.error('Error in email reminders cron:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Vercel cron configuration
export const config = {
  api: {
    bodyParser: false,
  },
};
