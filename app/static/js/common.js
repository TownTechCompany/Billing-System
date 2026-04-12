/**
 * TownTech Alert System
 * Unified alert notifications using SweetAlert2
 */

const townTechAlert = {
  /**
   * Top Right Alert - Success
   */
  successTopRight: (title = 'Success', message = '', timer = 3000) => {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      toast: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  /**
   * Top Right Alert - Error
   */
  errorTopRight: (title = 'Error', message = '', timer = 4000) => {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      toast: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  /**
   * Top Right Alert - Warning
   */
  warningTopRight: (title = 'Warning', message = '', timer = 4000) => {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      toast: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  /**
   * Top Right Alert - Info
   */
  infoTopRight: (title = 'Info', message = '', timer = 3000) => {
    Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      toast: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  /**
   * Center Alert - Success
   */
  successCenter: (title = 'Success', message = '', showConfirm = true) => {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      position: 'center',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3b82f6',
      showConfirmButton: showConfirm,
      allowOutsideClick: false
    });
  },

  /**
   * Center Alert - Error
   */
  errorCenter: (title = 'Error', message = '', showConfirm = true) => {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      position: 'center',
      confirmButtonText: 'OK',
      confirmButtonColor: '#ef4444',
      showConfirmButton: showConfirm,
      allowOutsideClick: false
    });
  },

  /**
   * Center Alert - Warning
   */
  warningCenter: (title = 'Warning', message = '', showConfirm = true) => {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      position: 'center',
      confirmButtonText: 'OK',
      confirmButtonColor: '#f59e0b',
      showConfirmButton: showConfirm,
      allowOutsideClick: false
    });
  },

  /**
   * Center Alert - Info
   */
  infoCenter: (title = 'Info', message = '', showConfirm = true) => {
    Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      position: 'center',
      confirmButtonText: 'OK',
      confirmButtonColor: '#0ea5e9',
      showConfirmButton: showConfirm,
      allowOutsideClick: false
    });
  },

  /**
   * Center Confirmation Dialog - Yes/No
   */
  confirmDialog: (title = 'Confirm', message = '', onConfirm, onCancel) => {
    Swal.fire({
      icon: 'question',
      title: title,
      text: message,
      position: 'center',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed && onConfirm) {
        onConfirm();
      } else if (result.isDismissed && onCancel) {
        onCancel();
      }
    });
  },

  /**
   * Top Right Alert - General (Custom)
   */
  toastTopRight: (icon = 'info', title = 'Alert', timer = 3000) => {
    Swal.fire({
      icon: icon,
      title: title,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      toast: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  /**
   * Loading Alert - Center
   */
  loading: (title = 'Loading...') => {
    Swal.fire({
      title: title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: async () => {
        await Swal.showLoading();
      }
    });
  },

  /**
   * Close any open alert
   */
  close: () => {
    Swal.close();
  }
};
