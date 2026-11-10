using KitsuMarket.API.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KitsuMarket.API.Data.EntityConfigurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Slug)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(p => p.Slug)
            .IsUnique();

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(p => p.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(p => p.StockQuantity)
            .IsRequired();

        builder.Property(p => p.ImageUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(p => p.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(p => p.IsFeatured)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.CreatedAtUtc)
            .IsRequired();

        builder.Property(p => p.UpdatedAtUtc);

        // Performance indexes for querying and filtering
        builder.HasIndex(p => new { p.IsActive, p.CategoryId });
        builder.HasIndex(p => new { p.IsActive, p.IsFeatured });
        builder.HasIndex(p => new { p.IsActive, p.Price });
    }
}
