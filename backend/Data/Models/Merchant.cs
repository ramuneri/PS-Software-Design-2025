using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

    public class Merchant
    {
        [Key]
        public int MerchantId { get; set; }

        public string? OwnerId { get; set; }

        public string? Name { get; set; }
        public string? BusinessType { get; set; }
        public string? Country { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? PaymentProvider { get; set; }
        public string? PaymentConfig { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
        public ICollection<Service> Services { get; set; } = new List<Service>();
        public ICollection<MerchantSubscription> Subscriptions { get; set; } = new List<MerchantSubscription>();
    public ICollection<TaxCategories> TaxCategories { get; set; } = new List<TaxCategories>();
    public ICollection<Giftcard> Giftcards { get; set; } = new List<Giftcard>();
    public ICollection<Invite> Invites { get; set; } = new List<Invite>();
}
