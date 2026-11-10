using KitsuMarket.API.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KitsuMarket.API.Data.EntityConfigurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.OrderNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(o => o.OrderNumber)
            .IsUnique();

        builder.Property(o => o.UserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.HasIndex(o => o.UserId);

        builder.Property(o => o.Status)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(o => o.Status);

        builder.Property(o => o.TotalAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(o => o.ShippingFullName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(o => o.ShippingPhone)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(o => o.ShippingAddress)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(o => o.ShippingCity)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(o => o.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(o => o.User)
            .WithMany()
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
