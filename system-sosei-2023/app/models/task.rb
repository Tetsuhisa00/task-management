class Task < ApplicationRecord
  belongs_to :status
  belongs_to :priority
  belongs_to :shape

  has_many :tasks
end
