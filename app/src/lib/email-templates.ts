export function getResetPasswordEmailHtml(resetUrl: string, email?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de votre mot de passe - Factarlou</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; tracking-tight: -0.5px;">
                Factarlou
              </h1>
              <p style="color: #d1fae5; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
                Facturation & Retenue à la Source en Tunisie
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px; text-align: left;">
              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
                Réinitialisation de votre mot de passe
              </h2>
              
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                Bonjour${email ? ` <strong style="color: #0f172a;">${email}</strong>` : ''},
              </p>
              
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 28px;">
                Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Factarlou. Cliquez sur le bouton sécurisé ci-dessous pour créer un nouveau mot de passe :
              </p>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 32px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #059669;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; background-color: #059669; border: 1px solid #047857;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link Fallback -->
              <p style="font-size: 12px; color: #64748b; margin-bottom: 24px; word-break: break-all; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
                <a href="${resetUrl}" style="color: #059669; text-decoration: underline;">${resetUrl}</a>
              </p>

              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px;">
                <p style="font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5;">
                  🔒 <strong>Sécurité :</strong> Ce lien est valide temporairement. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe restera inchangé.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                © 2026 Factarlou. Tous droits réservés.<br>
                <a href="https://factarlou.online" style="color: #059669; text-decoration: none;">factarlou.online</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function getConfirmAccountEmailHtml(confirmUrl: string, email?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Factarlou - Confirmez votre email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 36px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; tracking-tight: -0.5px;">
                Bienvenue sur Factarlou 🎉
              </h1>
              <p style="color: #d1fae5; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">
                Votre plateforme professionnelle de facturation en Tunisie
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px; text-align: left;">
              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
                Plus qu'une étape pour activer votre compte !
              </h2>
              
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                Bonjour${email ? ` <strong style="color: #0f172a;">${email}</strong>` : ''},
              </p>
              
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 28px;">
                Merci de vous être inscrit sur <strong>Factarlou</strong>. Pour valider votre adresse email et accéder à votre espace de facturation, devis et attestations de retenues, veuillez cliquer ci-dessous :
              </p>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 32px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #059669;">
                    <a href="${confirmUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; background-color: #059669; border: 1px solid #047857;">
                      Confirmer mon inscription
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Features Box -->
              <div style="background-color: #f8fafc; border-radius: 12px; p-4; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 10px;">
                  Ce que vous pouvez faire avec Factarlou :
                </h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.8;">
                  <li>📄 Créer des factures, devis, avoirs et bons de commande personnalisés</li>
                  <li>🇹🇳 Calcul automatique du Droit de Timbre et Retenues à la source (TND)</li>
                  <li>🎨 Personnalisation complète des couleurs, logos et cachets sur vos PDF</li>
                  <li>📱 Application 100% adaptée pour smartphone et ordinateur</li>
                </ul>
              </div>

              <!-- Link Fallback -->
              <p style="font-size: 12px; color: #64748b; margin-bottom: 24px; word-break: break-all; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <a href="${confirmUrl}" style="color: #059669; text-decoration: underline;">${confirmUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                © 2026 Factarlou. Tous droits réservés.<br>
                <a href="https://factarlou.online" style="color: #059669; text-decoration: none;">factarlou.online</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
