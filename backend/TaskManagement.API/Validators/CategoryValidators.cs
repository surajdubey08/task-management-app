using FluentValidation;
using TaskManagement.API.DTOs;

namespace TaskManagement.API.Validators
{
    public class CreateCategoryDtoValidator : AbstractValidator<CreateCategoryDto>
    {
        public CreateCategoryDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(100).WithMessage("Name must not exceed 100 characters.")
                .MinimumLength(2).WithMessage("Name must be at least 2 characters long.");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description must not exceed 500 characters.")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Color)
                .NotEmpty().WithMessage("Color is required.")
                .Matches(@"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
                .WithMessage("Color must be a valid hex color code (e.g., #FF5733).");
        }
    }

    public class UpdateCategoryDtoValidator : AbstractValidator<UpdateCategoryDto>
    {
        public UpdateCategoryDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(100).WithMessage("Name must not exceed 100 characters.")
                .MinimumLength(2).WithMessage("Name must be at least 2 characters long.");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description must not exceed 500 characters.")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Color)
                .NotEmpty().WithMessage("Color is required.")
                .Matches(@"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
                .WithMessage("Color must be a valid hex color code (e.g., #FF5733).");
        }
    }

    public class CreateTaskCommentDtoValidator : AbstractValidator<CreateTaskCommentDto>
    {
        public CreateTaskCommentDtoValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Comment content is required.")
                .MaximumLength(2000).WithMessage("Comment must not exceed 2000 characters.")
                .MinimumLength(1).WithMessage("Comment cannot be empty.");

            RuleFor(x => x.UserId)
                .GreaterThan(0).WithMessage("Valid user ID is required.");
        }
    }

    public class UpdateTaskCommentDtoValidator : AbstractValidator<UpdateTaskCommentDto>
    {
        public UpdateTaskCommentDtoValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Comment content is required.")
                .MaximumLength(2000).WithMessage("Comment must not exceed 2000 characters.")
                .MinimumLength(1).WithMessage("Comment cannot be empty.");
        }
    }
}