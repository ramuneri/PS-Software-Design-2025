public interface INotificationSmsService
{
    Task SendAppointmentCreatedAsync(
        string phoneNumber,
        DateTime startTime,
        string serviceName
    );
}
