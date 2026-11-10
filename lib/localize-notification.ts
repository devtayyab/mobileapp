/**
 * Localizes notification titles and messages based on the active language code.
 */
export function localizeNotificationText(
  title: string,
  message: string,
  lang: string
): { title: string; message: string } {
  if (!title && !message) return { title: '', message: '' };

  const safeTitle = title || '';
  const safeMessage = message || '';

  if (lang === 'el') {
    if (safeTitle.includes('Order Placed Successfully')) {
      return {
        title: 'Η παραγγελία τοποθετήθηκε επιτυχώς!',
        message: safeMessage
          .replace('Your order #', 'Η παραγγελία σας #')
          .replace(' has been received and is being processed.', ' παραλήφθηκε και επεξεργάζεται.'),
      };
    }
    if (safeTitle.includes('New Order Received')) {
      return {
        title: 'Νέα Παραγγελία!',
        message: safeMessage
          .replace('New order #', 'Νέα παραγγελία #')
          .replace(' received for ', ' παραλήφθηκε για: ')
          .replace('You have received a new order (', 'Λάβατε μια νέα παραγγελία (')
          .replace(')! Please review and prepare fulfillment.', ')! Παρακαλώ ελέγξτε και προετοιμάστε την αποστολή.'),
      };
    }
    if (safeTitle.includes('Order Update')) {
      return {
        title: 'Ενημέρωση Παραγγελίας',
        message: safeMessage
          .replace('Your order #', 'Η παραγγελία σας #')
          .replace(' status is now ', ' είναι πλέον: '),
      };
    }
    if (safeTitle.includes('New Message')) {
      return {
        title: 'Νέο Μήνυμα',
        message: safeMessage,
      };
    }
  } else if (lang === 'ur') {
    if (safeTitle.includes('Order Placed Successfully')) {
      return {
        title: 'آرڈر کامیابی سے موصول ہو گیا!',
        message: safeMessage
          .replace('Your order #', 'آپ کا آرڈر نمبر #')
          .replace(' has been received and is being processed.', ' موصول ہو چکا ہے اور پراسیس ہو رہا ہے۔'),
      };
    }
    if (safeTitle.includes('New Order Received')) {
      return {
        title: 'نیا آرڈر موصول ہوا!',
        message: safeMessage
          .replace('New order #', 'نیا آرڈر نمبر #')
          .replace(' received for ', ' موصول ہوا: ')
          .replace('You have received a new order (', 'آپ کو نیا آرڈر ملا ہے (')
          .replace(')! Please review and prepare fulfillment.', ')! برائے مہربانی چیک کر کے آرڈر تیار کریں۔'),
      };
    }
    if (safeTitle.includes('Order Update')) {
      return {
        title: 'آرڈر کی صورتحال',
        message: safeMessage
          .replace('Your order #', 'آپ کا آرڈر #')
          .replace(' status is now ', ' اب ہے: '),
      };
    }
    if (safeTitle.includes('New Message')) {
      return {
        title: 'نیا پیغام',
        message: safeMessage,
      };
    }
  } else if (lang === 'ar') {
    if (safeTitle.includes('Order Placed Successfully')) {
      return {
        title: 'تم تقديم الطلب بنجاح!',
        message: safeMessage
          .replace('Your order #', 'طلبك رقم #')
          .replace(' has been received and is being processed.', ' تم استلامه وجاري معالجته.'),
      };
    }
    if (safeTitle.includes('New Order Received')) {
      return {
        title: 'تم استلام طلب جديد!',
        message: safeMessage
          .replace('New order #', 'طلب جديد رقم #')
          .replace(' received for ', ' تم استلامه لـ: ')
          .replace('You have received a new order (', 'لقد استلمت طلباً جديداً (')
          .replace(')! Please review and prepare fulfillment.', ')! يرجى المراجعة والتجهيز للشحن.'),
      };
    }
    if (safeTitle.includes('Order Update')) {
      return {
        title: 'تحديث الطلب',
        message: safeMessage
          .replace('Your order #', 'طلبك رقم #')
          .replace(' status is now ', ' أصبحت حالته: '),
      };
    }
    if (safeTitle.includes('New Message')) {
      return {
        title: 'رسالة جديدة',
        message: safeMessage,
      };
    }
  } else if (lang === 'es') {
    if (safeTitle.includes('Order Placed Successfully')) {
      return {
        title: '¡Pedido realizado con éxito!',
        message: safeMessage
          .replace('Your order #', 'Su pedido #')
          .replace(' has been received and is being processed.', ' ha sido recibido y se está procesando.'),
      };
    }
    if (safeTitle.includes('New Order Received')) {
      return {
        title: '¡Nuevo pedido recibido!',
        message: safeMessage
          .replace('New order #', 'Nuevo pedido #')
          .replace(' received for ', ' recibido para: ')
          .replace('You have received a new order (', 'Ha recibido un nuevo pedido (')
          .replace(')! Please review and prepare fulfillment.', ')! Por favor revise y prepare el envío.'),
      };
    }
    if (safeTitle.includes('Order Update')) {
      return {
        title: 'Actualización del pedido',
        message: safeMessage
          .replace('Your order #', 'Su pedido #')
          .replace(' status is now ', ' ahora está: '),
      };
    }
    if (safeTitle.includes('New Message')) {
      return {
        title: 'Nuevo mensaje',
        message: safeMessage,
      };
    }
  } else if (lang === 'fr') {
    if (safeTitle.includes('Order Placed Successfully')) {
      return {
        title: 'Commande passée avec succès !',
        message: safeMessage
          .replace('Your order #', 'Votre commande #')
          .replace(' has been received and is being processed.', ' a été reçue et est en cours de traitement.'),
      };
    }
    if (safeTitle.includes('New Order Received')) {
      return {
        title: 'Nouvelle commande reçue !',
        message: safeMessage
          .replace('New order #', 'Nouvelle commande #')
          .replace(' received for ', ' reçue pour : ')
          .replace('You have received a new order (', 'Vous avez reçu une nouvelle commande (')
          .replace(')! Please review and prepare fulfillment.', ')! Veuillez vérifier et préparer l\'expédition.'),
      };
    }
    if (safeTitle.includes('Order Update')) {
      return {
        title: 'Mise à jour de commande',
        message: safeMessage
          .replace('Your order #', 'Votre commande #')
          .replace(' status is now ', ' est maintenant : '),
      };
    }
    if (safeTitle.includes('New Message')) {
      return {
        title: 'Nouveau message',
        message: safeMessage,
      };
    }
  } else if (lang === 'de') {
    if (safeTitle.includes('Order Placed Successfully')) {
      return {
        title: 'Bestellung erfolgreich aufgegeben!',
        message: safeMessage
          .replace('Your order #', 'Ihre Bestellung #')
          .replace(' has been received and is being processed.', ' ist eingegangen und wird bearbeitet.'),
      };
    }
    if (safeTitle.includes('New Order Received')) {
      return {
        title: 'Neue Bestellung erhalten!',
        message: safeMessage
          .replace('New order #', 'Neue Bestellung #')
          .replace(' received for ', ' erhalten für: ')
          .replace('You have received a new order (', 'Sie haben eine neue Bestellung erhalten (')
          .replace(')! Please review and prepare fulfillment.', ')! Bitte prüfen und Versand vorbereiten.'),
      };
    }
    if (safeTitle.includes('Order Update')) {
      return {
        title: 'Bestellaktualisierung',
        message: safeMessage
          .replace('Your order #', 'Ihre Bestellung #')
          .replace(' status is now ', ' ist jetzt: '),
      };
    }
    if (safeTitle.includes('New Message')) {
      return {
        title: 'Neue Nachricht',
        message: safeMessage,
      };
    }
  }

  return { title: safeTitle, message: safeMessage };
}
