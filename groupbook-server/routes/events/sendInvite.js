/*
=======================================================================================================================================
API Route: send_event_invite
=======================================================================================================================================
Method: POST
Purpose: Sends an email invitation to the party lead/organiser with event details and the shareable link.
         Only the event owner can send invites. Requires party_lead_email to be set.
=======================================================================================================================================
Request Payload:
{
  "event_id": 1        // integer, required - the event to send invite for
}

Success Response:
{
  "return_code": "SUCCESS",
  "message": "Invitation sent to sarah@example.com"
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"MISSING_FIELDS"
"EVENT_NOT_FOUND"
"FORBIDDEN"
"NO_ORGANISER_EMAIL"
"EMAIL_SEND_FAILED"
"UNAUTHORIZED"
"SERVER_ERROR"
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();
const { Resend } = require('resend');

const { query } = require('../../database');
const { verifyToken } = require('../../middleware/auth');
const { logApiCall } = require('../../utils/apiLogger');
const config = require('../../config/config');

// -----------------------------------------------------------------------
// Initialize Resend client
// -----------------------------------------------------------------------
const resend = new Resend(config.email.apiKey);

router.post('/sendInvite', verifyToken, async (req, res) => {
  logApiCall('send_event_invite');

  try {
    const { event_id } = req.body;
    const userId = req.user.id;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!event_id) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Event ID is required',
      });
    }

    // ---------------------------------------------------------------
    // Fetch the event with all details needed for the email
    // ---------------------------------------------------------------
    const eventResult = await query(
      `SELECT id, app_user_id, event_name, event_date_time, cutoff_datetime,
              party_lead_name, party_lead_email, link_token, restaurant_name
       FROM event
       WHERE id = $1`,
      [event_id]
    );

    if (eventResult.rows.length === 0) {
      return res.json({
        return_code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }

    const event = eventResult.rows[0];

    // ---------------------------------------------------------------
    // Verify the event belongs to the authenticated user
    // ---------------------------------------------------------------
    if (event.app_user_id !== userId) {
      return res.json({
        return_code: 'FORBIDDEN',
        message: 'You do not have permission to send invites for this event',
      });
    }

    // ---------------------------------------------------------------
    // Check that party lead email exists
    // ---------------------------------------------------------------
    if (!event.party_lead_email) {
      return res.json({
        return_code: 'NO_ORGANISER_EMAIL',
        message: 'No organiser email address is set for this event',
      });
    }

    // ---------------------------------------------------------------
    // Build the shareable link
    // ---------------------------------------------------------------
    const shareableLink = `${config.email.verificationUrl}/event/${event.link_token}`;

    // ---------------------------------------------------------------
    // Format the event date for the email
    // ---------------------------------------------------------------
    const eventDate = new Date(event.event_date_time);
    const formattedDate = eventDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // ---------------------------------------------------------------
    // Format cutoff date if exists
    // ---------------------------------------------------------------
    let cutoffText = '';
    if (event.cutoff_datetime) {
      const cutoffDate = new Date(event.cutoff_datetime);
      const formattedCutoff = cutoffDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      const formattedCutoffTime = cutoffDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
      cutoffText = `Please ensure all guests have registered by ${formattedCutoff} at ${formattedCutoffTime}.`;
    }

    // ---------------------------------------------------------------
    // Build the email content
    // ---------------------------------------------------------------
    const organiserName = event.party_lead_name || 'there';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1f2937; margin-bottom: 24px;">Your Group Booking at ${event.restaurant_name}</h1>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hi ${organiserName},
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Thank you for organising a group booking with us. Here are the details for your event:
        </p>

        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">${event.event_name}</h2>
          <p style="color: #374151; margin: 8px 0; font-size: 16px;">
            <strong>Date:</strong> ${formattedDate}
          </p>
          <p style="color: #374151; margin: 8px 0; font-size: 16px;">
            <strong>Time:</strong> ${formattedTime}
          </p>
          <p style="color: #374151; margin: 8px 0; font-size: 16px;">
            <strong>Venue:</strong> ${event.restaurant_name}
          </p>
        </div>

        <h3 style="color: #1f2937; margin-top: 32px;">How to Collect Guest Orders</h3>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Share the link below with your guests. They can use it to add their name, food order, and any dietary requirements:
        </p>

        <div style="background-color: #dbeafe; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
          <a href="${shareableLink}" style="color: #2563eb; font-size: 16px; word-break: break-all;">
            ${shareableLink}
          </a>
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          ${cutoffText}
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          You can view and edit the guest list at any time using the same link.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          If you have any questions, please contact ${event.restaurant_name} directly.
        </p>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Sent via Group Book
        </p>
      </div>
    `;

    const emailText = `
Your Group Booking at ${event.restaurant_name}

Hi ${organiserName},

Thank you for organising a group booking with us. Here are the details for your event:

${event.event_name}
Date: ${formattedDate}
Time: ${formattedTime}
Venue: ${event.restaurant_name}

How to Collect Guest Orders
----------------------------
Share the link below with your guests. They can use it to add their name, food order, and any dietary requirements:

${shareableLink}

${cutoffText}

You can view and edit the guest list at any time using the same link.

If you have any questions, please contact ${event.restaurant_name} directly.

Sent via Group Book
    `.trim();

    // ---------------------------------------------------------------
    // Send the email via Resend
    // ---------------------------------------------------------------
    const { data, error } = await resend.emails.send({
      from: `${config.email.name} <${config.email.from}>`,
      to: event.party_lead_email,
      subject: `Your Group Booking: ${event.event_name} at ${event.restaurant_name}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.json({
        return_code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send email. Please try again later.',
      });
    }

    // ---------------------------------------------------------------
    // Return success response
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      message: `Invitation sent to ${event.party_lead_email}`,
    });

  } catch (error) {
    console.error('Send invite error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
