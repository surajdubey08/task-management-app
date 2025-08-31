using FluentValidation;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;

namespace TaskManagement.API.Validators
{
    public class CreateTaskDtoValidator : AbstractValidator<CreateTaskDto>
    {
        public CreateTaskDtoValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MaximumLength(200).WithMessage("Title must not exceed 200 characters.")
                .MinimumLength(3).WithMessage("Title must be at least 3 characters long.");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Invalid status value.");

            RuleFor(x => x.Priority)
                .IsInEnum().WithMessage("Invalid priority value.");

            RuleFor(x => x.DueDate)
                .GreaterThan(DateTime.UtcNow.AddDays(-1)).WithMessage("Due date cannot be in the past.")
                .When(x => x.DueDate.HasValue);

            RuleFor(x => x.UserId)
                .GreaterThan(0).WithMessage("Valid user ID is required.");

            RuleFor(x => x.CategoryId)
                .GreaterThan(0).WithMessage("Valid category ID is required.")
                .When(x => x.CategoryId.HasValue);
        }
    }

    public class UpdateTaskDtoValidator : AbstractValidator<UpdateTaskDto>
    {
        public UpdateTaskDtoValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MaximumLength(200).WithMessage("Title must not exceed 200 characters.")
                .MinimumLength(3).WithMessage("Title must be at least 3 characters long.");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Invalid status value.");

            RuleFor(x => x.Priority)
                .IsInEnum().WithMessage("Invalid priority value.");

            RuleFor(x => x.DueDate)
                .GreaterThan(DateTime.UtcNow.AddDays(-1)).WithMessage("Due date cannot be in the past.")
                .When(x => x.DueDate.HasValue);

            RuleFor(x => x.UserId)
                .GreaterThan(0).WithMessage("Valid user ID is required.");

            RuleFor(x => x.CategoryId)
                .GreaterThan(0).WithMessage("Valid category ID is required.")
                .When(x => x.CategoryId.HasValue);
        }
    }
}