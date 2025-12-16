public class NotificationSmsService : INotificationSmsService
{
    private readonly ILogger<NotificationSmsService> _logger;

    public NotificationSmsService(ILogger<NotificationSmsService> logger)
    {
        _logger = logger;
    }

    public Task SendAppointmentCreatedAsync(
        string phoneNumber,
        DateTime startTime,
        string serviceName
    )
    {
        _logger.LogInformation(
            "[SMS STUB] Appointment created | Phone={Phone}, Service={Service}, Start={Start}",
            phoneNumber,
            serviceName,
            startTime
        );

        return Task.CompletedTask;
    }
}
